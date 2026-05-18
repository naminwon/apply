import { Briefcase, Layers, Users } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import type { Job, JobMaster, JoinedRecord } from '../../api/types';
import { getJobColor } from '../../constants/colors';
import { buildLatestSnapshot } from '../../utils/trendData';

interface KPISummaryProps {
  joined: JoinedRecord[];
  jobs: JobMaster[];
}

export function KPISummary({ joined, jobs }: KPISummaryProps) {
  // 누적 지원자 = 「지원자 추이」 그래프 최신 측정일 값의 합(wave-aware).
  const totalApplicants = useMemo(
    () => buildLatestSnapshot(joined).total,
    [joined],
  );

  const activeJobs = jobs.filter((j) => j.상태 === '운영중');
  const activeJobTypes: Job[] = Array.from(
    new Set(activeJobs.map((j) => j.직무구분)),
  );

  // 수집 시작일 = 최초 게시일 (jobs.게시일 중 최솟값). yyyy-MM-dd 사전순 = 시간순.
  const collectionStart =
    jobs.length === 0
      ? null
      : jobs.reduce(
          (min, j) => (j.게시일 && j.게시일 < min ? j.게시일 : min),
          jobs[0].게시일 || '9999-99-99',
        );

  return (
    <section className="grid grid-cols-3 gap-3">
      <KPICard
        icon={<Users size={18} />}
        label="누적 지원자"
        hint={collectionStart ? `${collectionStart}부터 누적` : undefined}
      >
        <span className="text-kpi text-text-primary">
          {totalApplicants.toLocaleString()}
        </span>
        <span className="ml-1 text-body text-text-tertiary">명</span>
      </KPICard>

      <KPICard icon={<Briefcase size={18} />} label="활성 공고 수">
        <span className="text-kpi text-text-primary">{activeJobs.length}</span>
        <span className="ml-1 text-body text-text-tertiary">
          / 전체 {jobs.length}건
        </span>
      </KPICard>

      <KPICard icon={<Layers size={18} />} label="진행 중인 직무">
        {activeJobTypes.length === 0 ? (
          <span className="text-body text-text-tertiary">없음</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeJobTypes.map((j) => (
              <span
                key={j}
                className="rounded-sm px-2 py-0.5 text-caption text-white"
                style={{ backgroundColor: getJobColor(j) }}
              >
                {j}
              </span>
            ))}
          </div>
        )}
      </KPICard>
    </section>
  );
}

function KPICard({
  icon,
  label,
  hint,
  children,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md bg-bg-base p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-text-tertiary">
        {icon}
        <span className="text-body">{label}</span>
      </div>
      <div className="flex flex-wrap items-end gap-1">{children}</div>
      {hint && (
        <p className="mt-1 text-caption text-text-tertiary">{hint}</p>
      )}
    </div>
  );
}
