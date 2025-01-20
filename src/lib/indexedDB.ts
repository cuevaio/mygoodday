import { Message } from 'ai';

// Define the structure of our stored data
interface MessageStore {
  userId: string;
  messages: Message[];
}

export const DB_NAME = 'chat_db';
export const STORE_NAME = 'messages';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
};

export const saveMessages = async (
  userId: string,
  messages: Message[]
): Promise<IDBValidKey> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Sort messages by creation time before saving
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );
    
    const request = store.put({ userId, messages: sortedMessages } as MessageStore);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getMessages = async (
  userId: string,
  limit: number = 10,
  before?: number
): Promise<Message[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as MessageStore | undefined;
      if (!result?.messages || result.messages.length === 0) {
        resolve([]);
        return;
      }

      // Sort messages by creation time in ascending order (oldest first)
      const sortedMessages = [...result.messages].sort(
        (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      );

      let filteredMessages = sortedMessages;
      if (before) {
        filteredMessages = sortedMessages.filter(
          m => new Date(m.createdAt!).getTime() < before
        );
      }

      // Get only the requested number of messages
      const paginatedMessages = filteredMessages.slice(0, limit);
      resolve(paginatedMessages);
    };
  });
};
