import { useMemo } from 'react';
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
import type { JoinedRecord } from '../../api/types';
import {
  useFilterStore,
  type GraphType,
  type Period,
} from '../../stores/filterStore';
import { buildTrendBundle } from '../../utils/trendData';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

const MODE_OPTIONS: { value: GraphType; label: string }[] = [
  { value: 'site', label: '사이트별' },
  { value: 'job', label: '직무별' },
  { value: 'total', label: '전체 합계' },
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'all', label: '전체 기간' },
  { value: 'custom', label: '직접 입력' },
];

interface TrendChartProps {
  joined: JoinedRecord[];
}

export function TrendChart({ joined }: TrendChartProps) {
  const graphType = useFilterStore((s) => s.graphType);
  const period = useFilterStore((s) => s.period);
  const customStart = useFilterStore((s) => s.customStart);
  const customEnd = useFilterStore((s) => s.customEnd);
  const selectedJobs = useFilterStore((s) => s.selectedJobs);
  const selectedSites = useFilterStore((s) => s.selectedSites);

  const setGraphType = useFilterStore((s) => s.setGraphType);
  const setPeriod = useFilterStore((s) => s.setPeriod);
  const setCustomRange = useFilterStore((s) => s.setCustomRange);

  const { data, series } = useMemo(
    () =>
      buildTrendBundle({
        joined,
        period,
        customStart,
        customEnd,
        graphType,
        selectedJobs,
        selectedSites,
      }),
    [
      joined,
      period,
      customStart,
      customEnd,
      graphType,
      selectedJobs,
      selectedSites,
    ],
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={graphType}
        onChange={(e) => setGraphType(e.target.value as GraphType)}
        className="rounded-sm border border-border-default bg-bg-base px-2 py-1 text-caption text-text-primary focus:border-primary focus:outline-none"
        title="라인 단위"
      >
        {MODE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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
            onChange={(e) =>
              setCustomRange(e.target.value || null, customEnd)
            }
            className="rounded-sm border border-border-default bg-bg-base px-1.5 py-0.5 text-caption text-text-primary focus:border-primary focus:outline-none"
          />
          <span className="text-caption text-text-tertiary">~</span>
          <input
            type="date"
            value={customEnd ?? ''}
            onChange={(e) =>
              setCustomRange(customStart, e.target.value || null)
            }
            className="rounded-sm border border-border-default bg-bg-base px-1.5 py-0.5 text-caption text-text-primary focus:border-primary focus:outline-none"
          />
        </div>
      )}
    </div>
  );

  return (
    <Card title="지원자 추이" actions={actions} className="h-full">
      {data.length === 0 || series.length === 0 ? (
        <EmptyState message="선택된 조건의 데이터가 없습니다." height={260} />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <LineChart
            data={data}
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
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
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
