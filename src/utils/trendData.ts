import type { Job, JoinedRecord, Site } from '../api/types';
import { JOBS, SITES } from '../constants/enums';
import type { GraphType, Period } from '../stores/filterStore';
import { getJobColor, getSiteColor } from '../constants/colors';

export interface TrendSeries {
  key: string;
  color: string;
}

export type TrendPoint = { 측정일: string } & Record<string, number | string>;

export interface TrendBundle {
  data: TrendPoint[];
  series: TrendSeries[];
}

interface BuildOpts {
  /** 전체 joined (period 적용 전) */
  joined: JoinedRecord[];
  period: Period;
  customStart: string | null;
  customEnd: string | null;
  graphType: GraphType;
  selectedJobs: Job[];
  selectedSites: Site[];
}

/**
 * TrendChart 시계열 데이터 생성.
 *
 * 각 시점 D 의 카테고리(사이트/직무) 값은 "공고별 (측정일 ≤ D) MAX(지원자수) → 카테고리로 SUM".
 * 카테고리 분할(사이트 vs 직무 vs 전체)이 합을 보존하므로, 어느 차원의 합이든 항상 동일하다.
 * (이전 wave-aware 시도는 카테고리 간 합이 어긋났던 문제를 야기해 폐기됨.)
 *
 * X축 포인트: 가장 이른 게시일(0 시작점) + 모든 측정일. period 'custom' 은 그 안에서 클리핑.
 */
export const buildTrendBundle = ({
  joined,
  period,
  customStart,
  customEnd,
  graphType,
  selectedJobs,
  selectedSites,
}: BuildOpts): TrendBundle => {
  const displayDates = getDisplayDates(
    joined,
    period,
    customStart,
    customEnd,
  );
  if (displayDates.length === 0) return { data: [], series: [] };

  if (selectedJobs.length === 0 || selectedSites.length === 0) {
    return { data: [], series: [] };
  }

  const pool = joined.filter(
    (r) =>
      selectedJobs.includes(r.직무구분) && selectedSites.includes(r.사이트),
  );

  if (graphType === 'site') {
    const series = selectedSites.map<TrendSeries>((s) => ({
      key: s,
      color: getSiteColor(s),
    }));
    return {
      data: cumulativeByDate(
        pool,
        displayDates,
        (r) => r.사이트,
        series.map((s) => s.key),
      ),
      series,
    };
  }

  if (graphType === 'job') {
    // JobBreakdownChart 와 같은 순서(전체 데이터 기준 최신값 desc).
    const globalLatest = latestByKey(joined, (r) => r.직무구분, [...JOBS]);
    const ordered = [...selectedJobs].sort(
      (a, b) => (globalLatest[b] ?? 0) - (globalLatest[a] ?? 0),
    );
    const series = ordered.map<TrendSeries>((j) => ({
      key: j,
      color: getJobColor(j),
    }));
    return {
      data: cumulativeByDate(
        pool,
        displayDates,
        (r) => r.직무구분,
        series.map((s) => s.key),
      ),
      series,
    };
  }

  // total
  return {
    data: cumulativeByDate(pool, displayDates, () => '합계', ['합계']),
    series: [{ key: '합계', color: '#888780' }],
  };
};

/**
 * TrendChart 와 동일한 wave-aware 알고리즘으로 계산한 최신 측정일의 카테고리별 값.
 * 필터/기간 적용 없이 전체 joined 를 사용해 KPI·BreakdownBar·DonutChart 의 기준값으로 쓰임.
 */
export const latestByKey = (
  joined: JoinedRecord[],
  keyOf: (r: JoinedRecord) => string,
  seriesKeys: string[],
): Record<string, number> => {
  const displayDates = getDisplayDates(joined, 'all', null, null);
  const empty = Object.fromEntries(seriesKeys.map((k) => [k, 0]));
  if (displayDates.length === 0) return empty;
  const data = cumulativeByDate(joined, displayDates, keyOf, seriesKeys);
  const last = data[data.length - 1] as Record<string, number | string>;
  const out: Record<string, number> = { ...empty };
  for (const k of seriesKeys) {
    const v = last[k];
    if (typeof v === 'number') out[k] = v;
  }
  return out;
};

export interface LatestSnapshot {
  /** 데이터에 실제 등장한 사이트/직무 키도 포함 (enum 외 오탈자 등 누락 방지). */
  bySite: Record<string, number>;
  byJob: Record<string, number>;
  total: number;
}

export const buildLatestSnapshot = (
  joined: JoinedRecord[],
): LatestSnapshot => {
  const sitesInData = new Set<string>(joined.map((r) => r.사이트));
  const jobsInData = new Set<string>(joined.map((r) => r.직무구분));
  const siteKeys = Array.from(new Set<string>([...SITES, ...sitesInData]));
  const jobKeys = Array.from(new Set<string>([...JOBS, ...jobsInData]));
  const bySite = latestByKey(joined, (r) => r.사이트, siteKeys);
  const byJob = latestByKey(joined, (r) => r.직무구분, jobKeys);
  const total = Object.values(bySite).reduce((s, v) => s + v, 0);
  return { bySite, byJob, total };
};

/**
 * 표시할 X축 포인트.
 *
 * 가장 이른 게시일(zero 시작점) + 모든 측정일(unique, 정렬). period 'custom' 은 범위로 클리핑.
 */
const getDisplayDates = (
  joined: JoinedRecord[],
  period: Period,
  customStart: string | null,
  customEnd: string | null,
): string[] => {
  if (joined.length === 0) return [];

  const points = new Set<string>(joined.map((r) => r.측정일));
  const earliestPost = joined.reduce(
    (acc, r) => (acc === null || r.게시일 < acc ? r.게시일 : acc),
    null as string | null,
  );
  if (earliestPost) points.add(earliestPost);

  const all = Array.from(points).sort();
  if (period === 'all') return all;
  return all.filter((d) => {
    if (customStart && d < customStart) return false;
    if (customEnd && d > customEnd) return false;
    return true;
  });
};

/**
 * 각 displayDate D 에 대해 공고별 (측정일 ≤ D) MAX(지원자수) 를 구하고 keyOf 버킷에 SUM.
 *
 * 공고별 시계열을 측정일 오름차순으로 정렬한 뒤 포인터+running max 로 진행해
 * O(rows + dates × postings) 에 동작. seriesKeys 외 버킷은 합산에서 제외(필터 효과).
 */
const cumulativeByDate = (
  pool: JoinedRecord[],
  displayDates: string[],
  keyOf: (r: JoinedRecord) => string,
  seriesKeys: string[],
): TrendPoint[] => {
  const seriesSet = new Set(seriesKeys);

  interface Timeline {
    key: string;
    rows: Array<{ date: string; value: number }>;
  }
  const byPosting = new Map<string, Timeline>();
  for (const r of pool) {
    if (!r.공고URL) continue;
    let e = byPosting.get(r.공고URL);
    if (!e) {
      e = { key: keyOf(r), rows: [] };
      byPosting.set(r.공고URL, e);
    }
    e.rows.push({ date: r.측정일, value: r.지원자수 });
  }
  for (const e of byPosting.values()) {
    e.rows.sort((a, b) => a.date.localeCompare(b.date));
  }

  const ptr = new Map<string, number>();
  const runMax = new Map<string, number>();
  for (const url of byPosting.keys()) {
    ptr.set(url, 0);
    runMax.set(url, 0);
  }

  const out: TrendPoint[] = [];
  for (const D of displayDates) {
    const bucket: Record<string, number> = Object.fromEntries(
      seriesKeys.map((k) => [k, 0]),
    );
    for (const [url, e] of byPosting) {
      let i = ptr.get(url)!;
      let m = runMax.get(url)!;
      while (i < e.rows.length && e.rows[i].date.localeCompare(D) <= 0) {
        if (e.rows[i].value > m) m = e.rows[i].value;
        i += 1;
      }
      ptr.set(url, i);
      runMax.set(url, m);
      if (seriesSet.has(e.key)) bucket[e.key] += m;
    }
    out.push({ 측정일: D, ...bucket });
  }
  return out;
};
