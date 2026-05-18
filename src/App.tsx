import { useMemo } from 'react';
import { max as maxDate, parseISO } from 'date-fns';
import type { Job, Site } from './api/types';
import { Header } from './components/layout/Header';
import { KPISummary } from './components/kpi/KPISummary';
import { SidePanel } from './components/sidepanel/SidePanel';
import { GroupTrendCard } from './components/main/GroupTrendCard';
import { JobBreakdownChart } from './components/main/JobBreakdownChart';
import { PostingStackedBarChart } from './components/main/PostingStackedBarChart';
import { SiteDistributionChart } from './components/main/SiteDistributionChart';
import { TrendChart } from './components/main/TrendChart';
import { useDashboardData } from './hooks/useDashboardData';
import { useFilterStore } from './stores/filterStore';
import { getDateRange } from './utils/dateUtils';

export default function App() {
  const { data, isLoading, error } = useDashboardData();

  const selectedGroupDate = useFilterStore((s) => s.selectedGroupDate);
  const setSelectedJobs = useFilterStore((s) => s.setSelectedJobs);
  const setSelectedSites = useFilterStore((s) => s.setSelectedSites);

  const today = useMemo(() => new Date(), []);

  const referenceDate = useMemo(() => {
    if (!data || data.joined.length === 0) return today;
    return maxDate(data.joined.map((r) => parseISO(r.측정일)));
  }, [data, today]);

  const dataRange = useMemo(
    () => (data ? getDateRange(data.joined.map((r) => r.측정일)) : null),
    [data],
  );

  const selectedGroup = useMemo(() => {
    if (!data || !selectedGroupDate) return null;
    const postings = data.jobs.filter((j) => j.게시일 === selectedGroupDate);
    if (postings.length === 0) return null;
    const urls = new Set(postings.map((p) => p.공고URL));
    const logs = data.joined.filter(
      (r) => r.공고URL != null && urls.has(r.공고URL),
    );
    return { postings, logs };
  }, [data, selectedGroupDate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-subtle">
        <p className="text-body text-text-secondary">데이터 불러오는 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-subtle p-6">
        <div className="rounded-md bg-bg-base p-6 shadow-sm">
          <p className="text-h2 text-status-error">데이터 로드 실패</p>
          <p className="mt-1 text-body text-text-secondary">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
        </div>
      </div>
    );
  }

  const handleJobClick = (job: Job) => setSelectedJobs([job]);
  const handleSiteClick = (site: Site) => setSelectedSites([site]);

  return (
    <div className="flex h-screen flex-col bg-bg-subtle">
      <Header
        dataRange={dataRange}
        lastSync={data.lastSync}
        jobs={data.jobs}
        joined={data.joined}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <KPISummary joined={data.joined} jobs={data.jobs} />

        {/*
          상단 2x2 grid:
            [TrendChart  (좌, 1fr)]    [SiteDistribution (우, 320px)]
            [StackedBar  (좌, 1fr)]    [JobBreakdown      (우, 320px)]
          각 row 의 두 셀이 같은 높이로 stretch.
        */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gridAutoRows: 'minmax(0, auto)',
          }}
        >
          <TrendChart joined={data.joined} />
          <SiteDistributionChart
            joined={data.joined}
            onSiteClick={handleSiteClick}
          />
          <PostingStackedBarChart joined={data.joined} />
          <JobBreakdownChart
            joined={data.joined}
            onJobClick={handleJobClick}
          />
        </div>

        {/*
          하단: 사이드패널 + 그룹 선택 시 누적 추이 카드 (flex로 동일 높이 stretch)
        */}
        <div className="flex gap-3" style={{ minHeight: 500 }}>
          <div className="shrink-0" style={{ width: 320 }}>
            <SidePanel
              jobs={data.jobs}
              joined={data.joined}
              referenceDate={referenceDate}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            {selectedGroup && selectedGroupDate ? (
              <GroupTrendCard
                groupDate={selectedGroupDate}
                postings={selectedGroup.postings}
                logs={selectedGroup.logs}
                referenceDate={today}
              />
            ) : (
              <div className="grid h-full min-h-[350px] place-items-center rounded-md bg-bg-base p-6 text-center text-body text-text-tertiary shadow-sm">
                왼쪽 패널에서 게시일을 선택하면
                <br />해당 날짜에 게시된 공고들의 직무별 누적 추이가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
