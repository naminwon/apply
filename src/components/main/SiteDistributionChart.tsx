import { useMemo } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { JoinedRecord, Site } from '../../api/types';
import { getSiteColor } from '../../constants/colors';
import { buildLatestSnapshot } from '../../utils/trendData';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface SiteDistributionChartProps {
  joined: JoinedRecord[];
  onSiteClick: (site: Site) => void;
}

export function SiteDistributionChart({
  joined,
  onSiteClick,
}: SiteDistributionChartProps) {
  // 「지원자 추이」 최신 측정일의 사이트별 값과 동일한 기준(wave-aware).
  const { data, total } = useMemo(() => {
    const snap = buildLatestSnapshot(joined);
    const arr = Object.entries(snap.bySite)
      .filter(([, v]) => v > 0)
      .map(([사이트, 지원자수]) => ({ 사이트: 사이트 as Site, 지원자수 }))
      .sort((a, b) => b.지원자수 - a.지원자수);
    return { data: arr, total: snap.total };
  }, [joined]);

  return (
    <Card title="사이트별 비중" className="h-full">
      {data.length === 0 || total === 0 ? (
        <EmptyState message="데이터가 없습니다." height={260} />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="지원자수"
              nameKey="사이트"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={1}
              onClick={(d: { 사이트: Site }) => onSiteClick(d.사이트)}
              cursor="pointer"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.사이트} fill={getSiteColor(d.사이트)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [
                `${v.toLocaleString()}명 (${((v / total) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{
                fontSize: 12,
                border: '1px solid #E5E5E2',
                borderRadius: 4,
              }}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string, entry) => {
                const v = (entry?.payload as { 지원자수?: number } | undefined)
                  ?.지원자수;
                if (v == null) return value;
                const pct = ((v / total) * 100).toFixed(1);
                return `${value} ${pct}%`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
