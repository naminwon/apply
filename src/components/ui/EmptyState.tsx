import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  height?: number;
}

export function EmptyState({ message, height = 160 }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-text-tertiary"
      style={{ minHeight: height }}
    >
      <Inbox size={24} />
      <p className="text-body">{message}</p>
    </div>
  );
}
