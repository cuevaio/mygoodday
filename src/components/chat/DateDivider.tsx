interface DateDividerProps {
  date: Date;
}

export function DateDivider({ date }: DateDividerProps) {
  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getFullYear() !== today.getFullYear()) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="my-4 text-center">
      <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">
        {formatMessageDate(date)}
      </span>
    </div>
  );
} 