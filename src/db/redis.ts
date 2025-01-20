import { Redis } from '@upstash/redis';
import { Message } from 'ai';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Key format: chat:{userId}:messages
const formatChatKey = (userId: string) => `chat:${userId}:messages`;
const formatChatHashKey = (userId: string) => `chat:${userId}:messages:by-id`;

/**
 * Store new messages in the chat history
 * Using both ZADD (sorted set for chronological access) and HSET (hash for id lookup)
 */
export async function storeMessages(userId: string, messages: Message[]) {
  const setKey = formatChatKey(userId);
  const hashKey = formatChatHashKey(userId);

  // Store in sorted set for chronological access
  const scoreMembers = messages.map((message) => ({
    score: message.createdAt?.getTime() ?? Date.now(),
    member: JSON.stringify(message),
  }));
  await redis.zadd(setKey, scoreMembers[0], ...scoreMembers.slice(1));

  // Store in hash for id lookup
  const hashEntries = messages.map((message) => [
    message.id,
    JSON.stringify(message),
  ]);
  await redis.hset(hashKey, Object.fromEntries(hashEntries));
}

/**
 * Retrieve messages for a user with pagination
 * @param userId - The user's ID
 * @param limit - Number of messages to retrieve per page
 * @param lastTimestamp - Timestamp of the last message for pagination (optional)
 * @returns Array of messages
 */
export async function getMessages(
  userId: string,
  limit: number = 20,
  lastTimestamp?: number,
): Promise<Message[]> {
  const key = formatChatKey(userId);

  // If lastTimestamp is provided, get messages before that timestamp
  // Otherwise get the most recent messages
  const messages = await redis.zrange<Message[]>(
    key,
    lastTimestamp ? `(${lastTimestamp}` : '+inf',
    '-inf',
    {
      byScore: true,
      rev: true, // Reverse order to get newest messages first
      offset: 0,
      count: limit,
    },
  );
  // Parse the JSON strings back to Message objects
  return messages.map((msg) => ({
    ...msg,
    createdAt: new Date(msg.createdAt!),
  }));
}

/**
 * Get a single message by ID
 */
export async function getMessage(
  userId: string,
  messageId: string,
): Promise<Message | null> {
  const hashKey = formatChatHashKey(userId);
  const message = await redis.hget<string>(hashKey, messageId);

  if (!message) return null;

  const parsed = JSON.parse(message) as Message;
  return {
    ...parsed,
    createdAt: parsed.createdAt ? new Date(parsed.createdAt) : undefined,
  };
}

/**
 * Delete all messages for a user
 */
export async function clearChat(userId: string) {
  const setKey = formatChatKey(userId);
  const hashKey = formatChatHashKey(userId);

  await Promise.all([redis.del(setKey), redis.del(hashKey)]);
}
