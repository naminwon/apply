import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react';
import type { Job, JobMaster, JoinedRecord } from '../../api/types';
import { getJobColor, getSiteColor } from '../../constants/colors';
import { JOBS } from '../../constants/enums';
import { useFilterStore } from '../../stores/filterStore';
import { maxApplicantsPerJob } from '../../utils/aggregate';

interface PostingListProps {
  jobs: JobMaster[];
  joined: JoinedRecord[];
  referenceDate: Date;
}

type StatusFilter = 'all' | 'active' | 'closed';
type SortKey = 'recent' | 'applicants';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: '게시일 ↓' },
  { value: 'applicants', label: '지원자 ↓' },
];

interface PostingGroup {
  게시일: string;
  postings: JobMaster[];
  totalApplicants: number;
  jobs: Job[];
}

export function PostingList({ jobs, joined }: PostingListProps) {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const selectedGroupDate = useFilterStore((s) => s.selectedGroupDate);
  const setSelectedGroupDate = useFilterStore((s) => s.setSelectedGroupDate);

  const onSelectGroup = (date: string) => {
    setSelectedGroupDate(selectedGroupDate === date ? null : date);
  };

  const maxByJob = useMemo(() => maxApplicantsPerJob(joined), [joined]);
  const activeCount = jobs.filter((j) => j.상태 === '운영중').length;
  const closedCount = jobs.length - activeCount;

  const groups: PostingGroup[] = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = jobs.filter((j) => {
      if (statusFilter === 'active' && j.상태 !== '운영중') return false;
      if (statusFilter === 'closed' && j.상태 !== '마감') return false;
      if (kw && !j.공고명.toLowerCase().includes(kw)) return false;
      return true;
    });

    const byDate = new Map<string, JobMaster[]>();
    for (const j of filtered) {
      const arr = byDate.get(j.게시일);
      if (arr) arr.push(j);
      else byDate.set(j.게시일, [j]);
    }

    const result: PostingGroup[] = Array.from(byDate.entries()).map(
      ([date, postings]) => ({
        게시일: date,
        postings,
        totalApplicants: postings.reduce(
          (sum, p) => sum + (maxByJob.get(p.공고URL) ?? 0),
          0,
        ),
        jobs: JOBS.filter((j) => postings.some((p) => p.직무구분 === j)),
      }),
    );

    result.sort((a, b) => {
      switch (sortKey) {
        case 'applicants':
          return b.totalApplicants - a.totalApplicants;
        case 'recent':
        default:
          return b.게시일.localeCompare(a.게시일);
      }
    });

    return result;
  }, [jobs, keyword, statusFilter, sortKey, maxByJob]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border-default p-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="공고명 검색"
            className="w-full rounded-sm border border-border-default bg-bg-base py-1.5 pl-7 pr-2 text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <StatusChip
              label={`전체 ${jobs.length}`}
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            <StatusChip
              label={`진행 ${activeCount}`}
              active={statusFilter === 'active'}
              activeColor="#378ADD"
              onClick={() => setStatusFilter('active')}
            />
            <StatusChip
              label={`종료 ${closedCount}`}
              active={statusFilter === 'closed'}
              activeColor="#888780"
              onClick={() => setStatusFilter('closed')}
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-sm border border-border-default bg-bg-base px-1.5 py-0.5 text-caption text-text-secondary focus:border-primary focus:outline-none"
            title="정렬"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <p className="p-3 text-body text-text-tertiary">
            조건에 맞는 공고가 없습니다.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {groups.map((g) => (
              <li key={g.게시일}>
                <GroupCard
                  group={g}
                  isSelected={selectedGroupDate === g.게시일}
                  onSelect={() => onSelectGroup(g.게시일)}
                  maxByJob={maxByJob}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusChip({
  label,
  active,
  activeColor,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-caption transition-colors ${
        active
          ? 'border-transparent text-white'
          : 'border-border-default bg-bg-base text-text-secondary hover:border-text-tertiary'
      }`}
      style={active ? { backgroundColor: activeColor ?? '#2E5C8A' } : undefined}
    >
      {label}
    </button>
  );
}

interface GroupCardProps {
  group: PostingGroup;
  isSelected: boolean;
  onSelect: () => void;
  maxByJob: Map<string, number>;
}

function GroupCard({
  group,
  isSelected,
  onSelect,
  maxByJob,
}: GroupCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-sm border bg-bg-base ${
        isSelected ? 'border-primary' : 'border-border-default'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-start gap-2 p-2.5 text-left transition-colors hover:bg-bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isSelected ? 'bg-primary/5' : ''
        }`}
      >
        <span className="mt-0.5 text-text-tertiary">
          {isSelected ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-h3 text-text-primary">{group.게시일}</span>
            <span className="text-caption text-text-tertiary">
              {group.postings.length}건 · 누적{' '}
              {group.totalApplicants.toLocaleString()}명
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {group.jobs.map((j) => (
              <span
                key={j}
                className="rounded-sm px-1.5 py-0.5 text-caption text-white"
                style={{ backgroundColor: getJobColor(j) }}
              >
                {j}
              </span>
            ))}
          </div>
        </div>
      </button>
      {isSelected && (
        <ul className="space-y-1 border-t border-border-default bg-bg-subtle/40 p-1.5">
          {group.postings.map((p) => (
            <li key={p.공고URL}>
              <PostingChildCard
                job={p}
                totalApplicants={maxByJob.get(p.공고URL) ?? 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface PostingChildCardProps {
  job: JobMaster;
  totalApplicants: number;
}

function PostingChildCard({ job, totalApplicants }: PostingChildCardProps) {
  const isActive = job.상태 === '운영중';
  const statusColor = isActive ? '#378ADD' : '#888780';

  return (
    <div className="rounded-sm border border-transparent bg-bg-base p-2 text-left">
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className="rounded-sm px-1.5 py-0.5 text-caption text-white"
          style={{ backgroundColor: statusColor }}
        >
          {job.상태}
        </span>
        <span className="flex items-center gap-1 text-caption">
          <span className="text-text-secondary">{job.직무구분}</span>
          <span className="text-text-tertiary">·</span>
          <span style={{ color: getSiteColor(job.사이트) }}>{job.사이트}</span>
        </span>
        {job.공고URL && (
          <a
            href={job.공고URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-bg-subtle hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="원본 공고 새 탭에서 열기"
            aria-label="원본 공고 새 탭에서 열기"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <p className="mb-1 line-clamp-2 text-body text-text-primary">
        {job.공고명}
      </p>
      <p className="text-right text-h3 text-text-primary">
        {totalApplicants.toLocaleString()}
        <span className="ml-0.5 text-caption text-text-tertiary">명</span>
      </p>
    </div>
  );
}
