'use client';

import React from 'react';

import { useAuth, useUser } from '@clerk/nextjs';
import { createIdGenerator, Message } from 'ai';
import { useChat } from 'ai/react';

import { Input } from '@/components/ui/input';
import { DateDivider } from '@/components/chat/DateDivider';
import { MessageItem } from '@/components/chat/MessageItem';

import { getMessages, saveMessages } from '@/lib/indexedDB';

export default function Chat() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [lastTimestamp, setLastTimestamp] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const scrollableDivRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Add this utility function at the top of your component
  const deduplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Map<string, Message>();
    messages.forEach((message) => {
      if (!seen.has(message.id)) {
        seen.set(message.id, message);
      }
    });
    // Sort in ascending order (oldest first, newest last)
    return Array.from(seen.values()).sort(
      (a, b) =>
        new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime(),
    );
  };

  const { messages, setMessages, input, handleInputChange, handleSubmit } =
    useChat({
      id: userId ?? 'base_chat_id',
      sendExtraMessageFields: true,
      maxSteps: 1,
      experimental_prepareRequestBody({ messages }) {
        return { message: JSON.stringify(messages[messages.length - 1]) };
      },
      generateId: createIdGenerator({
        prefix: 'msg',
        separator: '_',
        size: 16,
      }),
      onResponse() {
        console.log('onResponse - attempting to scroll');
        scrollToBottom();
      },
      onFinish() {
        console.log('onFinish - attempting to scroll');
        scrollToBottom();
        // Cache messages when a new message is finished
        if (userId) {
          saveMessages(userId, messages).catch((error) => {
            console.error('Error saving messages:', error);
          });
        }
      },
    });

  const scrollToBottom = React.useCallback(() => {
    if (scrollableDivRef.current) {
      const scrollableDiv = scrollableDivRef.current;
      console.log('Scrolling to bottom:', {
        scrollHeight: scrollableDiv.scrollHeight,
        currentScrollTop: scrollableDiv.scrollTop,
        shouldAutoScroll,
      });

      if (shouldAutoScroll) {
        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
        console.log('New scrollTop after scroll:', scrollableDiv.scrollTop);
      } else {
        console.log(
          'Skipping scroll due to shouldAutoScroll:',
          shouldAutoScroll,
        );
      }
    } else {
      console.log('scrollableDivRef.current is null');
    }
  }, [shouldAutoScroll]);

  // Update the initial messages loading effect
  React.useEffect(() => {
    if (userId) {
      const loadInitialMessages = async () => {
        try {
          // First try to get messages from IndexedDB
          const cachedMessages = await getMessages(userId, 10);

          // If we have cached messages, use them immediately
          if (cachedMessages.length > 0) {
            const parsedMessages = cachedMessages.map((m: Message) => ({
              ...m,
              createdAt: new Date(m.createdAt!),
            }));

            setMessages(parsedMessages);
            // Scroll immediately after setting cached messages
            setTimeout(scrollToBottom, 0);

            if (parsedMessages[parsedMessages.length - 1]?.createdAt) {
              setLastTimestamp(
                new Date(
                  parsedMessages[parsedMessages.length - 1].createdAt,
                ).getTime(),
              );
            }
          }

          // Always fetch initial messages from API
          const response = await fetch('/api/chat?limit=10');
          const initialMessages = (await response.json()) as Message[];

          if (initialMessages.length > 0) {
            const parsedApiMessages = initialMessages.map((m) => ({
              ...m,
              createdAt: new Date(m.createdAt!),
            }));

            // Combine and deduplicate messages
            setMessages((prev) => {
              const combined = [...prev, ...parsedApiMessages];
              return deduplicateMessages(combined);
            });

            // Scroll immediately after setting API messages
            setTimeout(scrollToBottom, 0);

            // Cache the deduplicated messages
            await saveMessages(userId, parsedApiMessages);

            if (parsedApiMessages[parsedApiMessages.length - 1]?.createdAt) {
              setLastTimestamp(
                new Date(
                  parsedApiMessages[parsedApiMessages.length - 1].createdAt,
                ).getTime(),
              );
            }

            setHasMore(parsedApiMessages.length === 10);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };
      loadInitialMessages();
    }
  }, [userId, setMessages, scrollToBottom]);

  // Update the loadMoreMessages function
  const loadMoreMessages = React.useCallback(async () => {
    if (!userId || isLoading || !lastTimestamp) return;

    try {
      setIsLoading(true);

      // Get messages from IndexedDB first
      const cachedOlderMessages = await getMessages(userId, 10, lastTimestamp);

      if (cachedOlderMessages.length > 0) {
        const parsedCachedMessages = cachedOlderMessages.map((m) => ({
          ...m,
          createdAt: new Date(m.createdAt!),
        }));

        setMessages((prev) =>
          deduplicateMessages([...parsedCachedMessages, ...prev]),
        );

        if (parsedCachedMessages[parsedCachedMessages.length - 1]?.createdAt) {
          setLastTimestamp(
            new Date(
              parsedCachedMessages[parsedCachedMessages.length - 1].createdAt,
            ).getTime(),
          );
        }
      }

      // Then fetch from API
      const params = new URLSearchParams();
      params.append('lastTimestamp', lastTimestamp.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/chat?${params}`);
      const rawOlderMessages = (await response.json()) as Message[];

      if (rawOlderMessages.length > 0) {
        const olderMessages = rawOlderMessages.map((m) => ({
          ...m,
          createdAt: new Date(m.createdAt!),
        }));

        setMessages((prev) => {
          const newMessages = [...olderMessages, ...prev];
          const dedupedMessages = deduplicateMessages(newMessages);

          // Cache the deduplicated messages
          saveMessages(userId, dedupedMessages).catch((error) => {
            console.error('Error saving messages:', error);
          });

          return dedupedMessages;
        });

        setHasMore(olderMessages.length === 10);

        if (olderMessages[olderMessages.length - 1]?.createdAt) {
          setLastTimestamp(
            new Date(
              olderMessages[olderMessages.length - 1].createdAt,
            ).getTime(),
          );
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoading, lastTimestamp, setMessages, setIsLoading, setHasMore, setLastTimestamp]);

  const handleScroll = React.useCallback(() => {
    if (!scrollableDivRef.current || isLoading || !hasMore) {
      console.log('Scroll handler early return:', { isLoading, hasMore });
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollableDivRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    console.log('Scroll event:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      distanceFromBottom,
    });

    // Check if user is near top to load more messages
    if (scrollTop < 100) {
      console.log('Near top, loading more messages');
      loadMoreMessages();
    }

    // Update shouldAutoScroll based on position
    const newShouldAutoScroll = distanceFromBottom < 100;
    if (newShouldAutoScroll !== shouldAutoScroll) {
      console.log('Updating shouldAutoScroll:', newShouldAutoScroll);
      setShouldAutoScroll(newShouldAutoScroll);
    }
  }, [isLoading, hasMore, loadMoreMessages, shouldAutoScroll]);

  // Update the messages effect to only handle new messages
  React.useEffect(() => {
    console.log('Messages changed:', {
      messageCount: messages.length,
      shouldAutoScroll,
    });

    if (messages.length > 0) {
      setTimeout(scrollToBottom, 0);
    }
  }, [messages, shouldAutoScroll, scrollToBottom]); // Remove initialLoadComplete dependency

  React.useEffect(() => {
    const scrollableDiv = scrollableDivRef.current;
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      return () => scrollableDiv.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="stretch mx-auto flex w-full max-w-md flex-col px-4 py-24">
      <div
        ref={scrollableDivRef}
        className="h-[calc(100vh-200px)] overflow-y-auto"
      >
        {isLoading && hasMore && (
          <div className="py-2 text-center">Loading more messages...</div>
        )}

        <div className="flex flex-col gap-2">
          {messages.reduce(
            (acc: React.JSX.Element[], message, index, array) => {
              const currentDate = new Date(message.createdAt!);
              const prevDate =
                index > 0 ? new Date(array[index - 1].createdAt!) : null;
              const currentDateKey = currentDate.toISOString().split('T')[0];
              const prevDateKey = prevDate?.toISOString().split('T')[0];

              if (!prevDate || currentDateKey !== prevDateKey) {
                acc.push(
                  <DateDivider
                    key={`date-${currentDateKey}`}
                    date={currentDate}
                  />,
                );
              }

              acc.push(
                <MessageItem
                  key={`message-${message.id}`}
                  message={message}
                  userImage={user?.imageUrl}
                />,
              );

              return acc;
            },
            [],
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          className="fixed bottom-0 mb-8 w-full max-w-md p-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
