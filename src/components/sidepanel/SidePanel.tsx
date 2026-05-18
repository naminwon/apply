import type { JobMaster, JoinedRecord } from '../../api/types';
import { PostingList } from './PostingList';

interface SidePanelProps {
  jobs: JobMaster[];
  joined: JoinedRecord[];
  referenceDate: Date;
}

export function SidePanel({ jobs, joined, referenceDate }: SidePanelProps) {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-md bg-bg-base shadow-sm">
      <PostingList jobs={jobs} joined={joined} referenceDate={referenceDate} />
    </aside>
  );
}
