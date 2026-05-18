import type { JoinedRecord } from '../api/types';

/**
 * 공고URL별 MAX(지원자수).
 * 지원자수는 누적이므로 사실상 마지막 측정일의 값이 된다 (data-schema §6.4).
 */
export const maxApplicantsPerJob = (
  joined: JoinedRecord[],
): Map<string, number> => {
  const m = new Map<string, number>();
  for (const r of joined) {
    if (!r.공고URL) continue;
    const prev = m.get(r.공고URL) ?? 0;
    if (r.지원자수 > prev) m.set(r.공고URL, r.지원자수);
  }
  return m;
};
