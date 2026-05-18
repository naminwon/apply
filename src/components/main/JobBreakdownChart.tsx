import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Job, JoinedRecord } from '../../api/types';
import { getJobColor } from '../../constants/colors';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface JobBreakdownChartProps {
  joined: JoinedRecord[];
  onJobClick: (job: Job) => void;
}

/**
 * 직무별 「회차당 평균 지원자」 — 공고 게시일(=모집 회차) 횟수로 누적치를 나눈 값.
 *   회차당평균 = SUM(공고별 MAX) ÷ DISTINCT(게시일)
 */
export function JobBreakdownChart({
  joined,
  onJobClick,
}: JobBreakdownChartProps) {
  const data = useMemo(() => {
    interface Posting {
      직무: Job;
      게시일: string;
      max: number;
    }
    const byPosting = new Map<string, Posting>();
    for (const r of joined) {
      if (!r.공고URL) continue;
      let p = byPosting.get(r.공고URL);
      if (!p) {
        p = { 직무: r.직무구분, 게시일: r.게시일, max: 0 };
        byPosting.set(r.공고URL, p);
      }
      if (r.지원자수 > p.max) p.max = r.지원자수;
    }

    const byJob = new Map<Job, { total: number; rounds: Set<string> }>();
    for (const p of byPosting.values()) {
      let bucket = byJob.get(p.직무);
      if (!bucket) {
        bucket = { total: 0, rounds: new Set() };
        byJob.set(p.직무, bucket);
      }
      bucket.total += p.max;
      bucket.rounds.add(p.게시일);
    }

    return Array.from(byJob.entries())
      .map(([직무, { total, rounds }]) => {
        const 회차수 = rounds.size;
        const 평균 = 회차수 > 0 ? Math.round((total / 회차수) * 10) / 10 : 0;
        return { 직무, 평균, 회차수, total };
      })
      .filter((d) => d.회차수 > 0)
      // 정렬은 누적 지원자(=직무별 총합) 내림차순 — TrendChart 직무별 라인 순서와 일치.
      .sort((a, b) => b.total - a.total);
  }, [joined]);

  return (
    <Card
      title="직무별 평균 지원자"
      subtitle={<span>누적 지원자 ÷ 모집 회차(게시일)</span>}
      className="h-full"
    >
      {data.length === 0 ? (
        <EmptyState message="데이터가 없습니다." height={260} />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          >
            <XAxis
              type="number"
              stroke="#888780"
              fontSize={11}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="직무"
              stroke="#444441"
              fontSize={12}
              width={56}
            />
            <Tooltip
              cursor={{ fill: 'rgba(46,92,138,0.06)' }}
              contentStyle={{
                fontSize: 12,
                border: '1px solid #E5E5E2',
                borderRadius: 4,
              }}
              formatter={(_v, _name, item) => {
                const p = item?.payload as
                  | { 평균: number; total: number; 회차수: number }
                  | undefined;
                if (!p) return ['', ''];
                return [
                  `${p.평균.toLocaleString()}명 (누적 ${p.total.toLocaleString()} ÷ ${p.회차수}회)`,
                  '회차당 평균',
                ];
              }}
            />
            <Bar
              dataKey="평균"
              cursor="pointer"
              onClick={(d: { 직무: Job }) => onJobClick(d.직무)}
              label={{
                position: 'right',
                fontSize: 11,
                fill: '#444441',
                formatter: (v: number) => v.toLocaleString(),
              }}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.직무} fill={getJobColor(entry.직무)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
