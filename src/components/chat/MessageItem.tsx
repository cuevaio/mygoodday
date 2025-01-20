import Image from 'next/image';

import { Message } from 'ai';
import { BotIcon, UserIcon } from 'lucide-react';

import { MacroSummary } from '@/components/macro-summary';
import { MacroSummaryLoading } from '@/components/macro-summary/skeleton';

interface MessageItemProps {
  message: Message;
  userImage?: string;
}

export function MessageItem({ message, userImage }: MessageItemProps) {
  return (
    <div className="flex items-start gap-3 whitespace-pre-wrap">
      {message.role === 'user' ? (
        userImage ? (
          <Image
            src={userImage}
            alt="User avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            <UserIcon className="h-5 w-5 text-gray-500" />
          </div>
        )
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
          <BotIcon className="h-5 w-5 text-white" />
        </div>
      )}
      <div className="flex-1">
        {message.toolInvocations?.length ? (
          message.toolInvocations.map(
            (ti, idx) =>
              ti.toolName === 'nutrients' &&
              (ti.state === 'result' ? (
                <MacroSummary
                  key={`${message.id}-result-${idx}`}
                  foods={ti.result}
                  messageId={message.id}
                  messageCreatedAt={message.createdAt!}
                />
              ) : (
                <MacroSummaryLoading key={`${message.id}-loading-${idx}`} />
              )),
          )
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );
}
