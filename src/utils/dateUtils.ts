import { differenceInDays, parseISO } from 'date-fns';

/** 게시일부터 referenceDate까지 경과일 (음수 방지). */
export const daysSince = (postedDate: string, referenceDate: Date): number =>
  Math.max(0, differenceInDays(referenceDate, parseISO(postedDate)));

/** 측정일 배열의 최소·최대 (`yyyy-MM-dd`). 빈 배열이면 null. */
export const getDateRange = (
  dates: string[],
): { start: string; end: string } | null => {
  if (dates.length === 0) return null;
  let min = dates[0];
  let max = dates[0];
  for (const d of dates) {
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { start: min, end: max };
};
