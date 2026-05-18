import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Job, JoinedRecord, Site } from '../../api/types';
import { getSiteColor } from '../../constants/colors';
import { SITES } from '../../constants/enums';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface PostingStackedBarChartProps {
  joined: JoinedRecord[];
}

const JOB_OPTIONS: Job[] = ['프론트', '백엔드', 'AI', '기획자', '디자이너'];

type Period = 'all' | 'custom';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'all', label: '전체 기간' },
  { value: 'custom', label: '직접 입력' },
];

type Row = {
  게시일: string;
  label: string;
  total: number;
} & Partial<Record<Site, number>>;

/**
 * 회차별 지원자 — 선택한 직무의 공고들을 게시일 기준으로 막대 그래프로 그리고,
 * 각 막대는 사이트별 (공고별 MAX) 누적치를 stack으로 표시.
 */
export function PostingStackedBarChart({ joined }: PostingStackedBarChartProps) {
  const [selectedJob, setSelectedJob] = useState<Job>('프론트');
  const [period, setPeriod] = useState<Period>('all');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  const data = useMemo<Row[]>(() => {
    interface Posting {
      사이트: Site;
      직무: Job;
      게시일: string;
      max: number;
    }
    const byPosting = new Map<string, Posting>();
    for (const r of joined) {
      if (!r.공고URL) continue;
      let p = byPosting.get(r.공고URL);
      if (!p) {
        p = {
          사이트: r.사이트,
          직무: r.직무구분,
          게시일: r.게시일,
          max: 0,
        };
        byPosting.set(r.공고URL, p);
      }
      if (r.지원자수 > p.max) p.max = r.지원자수;
    }

    const grouped = new Map<string, Row>();
    for (const p of byPosting.values()) {
      if (p.직무 !== selectedJob) continue;
      if (period === 'custom') {
        if (customStart && p.게시일 < customStart) continue;
        if (customEnd && p.게시일 > customEnd) continue;
      }
      let row = grouped.get(p.게시일);
      if (!row) {
        row = { 게시일: p.게시일, label: p.게시일, total: 0 };
        for (const s of SITES) row[s] = 0;
        grouped.set(p.게시일, row);
      }
      row[p.사이트] = (row[p.사이트] ?? 0) + p.max;
      row.total += p.max;
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.게시일.localeCompare(b.게시일),
    );
  }, [joined, selectedJob, period, customStart, customEnd]);

  const actions = (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={selectedJob}
        onChange={(e) => setSelectedJob(e.target.value as Job)}
        className="rounded-sm border border-border-default bg-bg-base px-2 py-1 text-caption text-text-primary focus:border-primary focus:outline-none"
        title="직무"
      >
        {JOB_OPTIONS.map((j) => (
          <option key={j} value={j}>
            {j}
          </option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as Period)}
        className="rounded-sm border border-border-default bg-bg-base px-2 py-1 text-caption text-text-primary focus:border-primary focus:outline-none"
        title="기간"
      >
        {PERIOD_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {period === 'custom' && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={customStart ?? ''}
            onChange={(e) => setCustomStart(e.target.value || null)}
            className="rounded-sm border border-border-default bg-bg-base px-1.5 py-0.5 text-caption text-text-primary focus:border-primary focus:outline-none"
          />
          <span className="text-caption text-text-tertiary">~</span>
          <input
            type="date"
            value={customEnd ?? ''}
            onChange={(e) => setCustomEnd(e.target.value || null)}
            className="rounded-sm border border-border-default bg-bg-base px-1.5 py-0.5 text-caption text-text-primary focus:border-primary focus:outline-none"
          />
        </div>
      )}
    </div>
  );

  return (
    <Card title="회차별 지원자" actions={actions} className="h-full">
      {data.length === 0 ? (
        <EmptyState message="해당 직무의 공고가 없습니다." height={260} />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: -8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E2" />
            <XAxis
              dataKey="label"
              stroke="#888780"
              fontSize={11}
              interval={0}
            />
            <YAxis stroke="#888780" fontSize={11} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                border: '1px solid #E5E5E2',
                borderRadius: 4,
              }}
              formatter={(v: number) => v.toLocaleString()}
              labelFormatter={(label, items) => {
                const payload = items?.[0]?.payload as Row | undefined;
                if (!payload) return label;
                return `${payload.게시일} (${selectedJob}) · 합 ${payload.total.toLocaleString()}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
            {SITES.map((s) => (
              <Bar
                key={s}
                dataKey={s}
                stackId="round"
                fill={getSiteColor(s)}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

