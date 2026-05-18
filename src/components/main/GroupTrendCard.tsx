import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Job, JobMaster, JoinedRecord, Site } from '../../api/types';
import { getJobColor, getSiteColor } from '../../constants/colors';
import { JOBS, SITES } from '../../constants/enums';
import { useFilterStore } from '../../stores/filterStore';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

type GroupMode = 'job' | 'site' | 'total';

const MODE_OPTIONS: { value: GroupMode; label: string }[] = [
  { value: 'job', label: '직무별' },
  { value: 'site', label: '사이트별' },
  { value: 'total', label: '전체 합계' },
];

const TOTAL_KEY = '전체';
const TOTAL_COLOR = '#2E5C8A';

interface GroupTrendCardProps {
  /** 선택된 그룹의 게시일 (yyyy-MM-dd) */
  groupDate: string;
  /** 해당 게시일의 공고들 */
  postings: JobMaster[];
  /** 해당 게시일 공고들의 모든 측정 로그 */
  logs: JoinedRecord[];
  /** 오늘 (운영중 공고의 X축 끝점) */
  referenceDate: Date;
}

export function GroupTrendCard({
  groupDate,
  postings,
  logs,
  referenceDate,
}: GroupTrendCardProps) {
  const close = useFilterStore((s) => s.setSelectedGroupDate);
  const [mode, setMode] = useState<GroupMode>('job');

  const jobsInGroup = useMemo<Job[]>(
    () => JOBS.filter((j) => postings.some((p) => p.직무구분 === j)),
    [postings],
  );
  const sitesInGroup = useMemo<Site[]>(
    () => SITES.filter((s) => postings.some((p) => p.사이트 === s)),
    [postings],
  );

  // 차트 라인 키 + 색상.
  const seriesKeys = useMemo<string[]>(() => {
    if (mode === 'job') return jobsInGroup;
    if (mode === 'site') return sitesInGroup;
    return [TOTAL_KEY];
  }, [mode, jobsInGroup, sitesInGroup]);

  const colorFor = (key: string): string => {
    if (mode === 'job') return getJobColor(key);
    if (mode === 'site') return getSiteColor(key);
    return TOTAL_COLOR;
  };

  const { rows, endLabel } = useMemo(() => {
    // X축 포인트: 게시일(0) + 각 측정일(실측값). 운영중 그룹이면 오늘도 추가하여
    // 마지막 측정일 이후 오늘까지 선이 이어지도록 함.
    const measureDates = Array.from(new Set(logs.map((r) => r.측정일))).sort();
    const todayStr = format(referenceDate, 'yyyy-MM-dd');
    const hasActive = postings.some((p) => p.상태 === '운영중');
    const pointSet = new Set<string>();
    pointSet.add(groupDate);
    for (const d of measureDates) pointSet.add(d);
    if (hasActive) pointSet.add(todayStr);
    const sortedPoints = Array.from(pointSet).sort();

    // 공고URL → 측정일 → 지원자수
    const logByPostingDate = new Map<string, Map<string, number>>();
    for (const r of logs) {
      if (!r.공고URL) continue;
      let m = logByPostingDate.get(r.공고URL);
      if (!m) {
        m = new Map();
        logByPostingDate.set(r.공고URL, m);
      }
      m.set(r.측정일, r.지원자수);
    }

    const bucketKey = (p: JobMaster): string => {
      if (mode === 'job') return p.직무구분;
      if (mode === 'site') return p.사이트;
      return TOTAL_KEY;
    };

    // 각 X축 포인트 × 공고에 대해 이전까지의 누적 최댓값(carry-forward) → bucket 합산.
    const result = sortedPoints.map((date) => {
      const row: Record<string, string | number> = { 측정일: date };
      for (const key of seriesKeys) row[key] = 0;
      for (const p of postings) {
        const m = logByPostingDate.get(p.공고URL);
        let value = 0;
        if (m) {
          for (const [d, v] of m) {
            if (d.localeCompare(date) <= 0 && v > value) value = v;
          }
        }
        const key = bucketKey(p);
        row[key] = (row[key] as number) + value;
      }
      return row;
    });

    // 끝점 라벨: 운영중 그룹이면 오늘, 모두 마감이면 마지막 측정일.
    const lastMeasure = measureDates[measureDates.length - 1];
    const endLabel = hasActive ? todayStr : lastMeasure ?? groupDate;

    return { rows: result, endLabel };
  }, [groupDate, logs, postings, referenceDate, seriesKeys, mode]);

  const hasAnyData = rows.some((r) =>
    seriesKeys.some((k) => (r[k] as number) > 0),
  );

  const actions = (
    <div className="flex items-center gap-1.5">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as GroupMode)}
        className="rounded-sm border border-border-default bg-bg-base px-2 py-1 text-caption text-text-primary focus:border-primary focus:outline-none"
        title="라인 단위"
      >
        {MODE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => close(null)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-subtle hover:text-text-secondary"
        title="선택 해제"
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <Card
      className="h-full border border-primary/30"
      title={`${groupDate} 게시 공고 누적 추이`}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-text-secondary">
            {postings.length}건 · {groupDate} ~ {endLabel}
          </span>
        </span>
      }
      actions={actions}
    >
      {!hasAnyData ? (
        <EmptyState message="측정 기록이 없습니다." height={270} />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={330}>
          <LineChart
            data={rows}
            margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E2" />
            <XAxis dataKey="측정일" stroke="#888780" fontSize={11} />
            <YAxis stroke="#888780" fontSize={11} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                border: '1px solid #E5E5E2',
                borderRadius: 4,
              }}
              formatter={(v: number) => v.toLocaleString()}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
            {seriesKeys.map((k) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={colorFor(k)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
