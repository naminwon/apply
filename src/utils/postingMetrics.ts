/**
 * Phase 2: 모집인원 기반 경쟁률 / 목표달성률.
 *
 * - 경쟁률: 지원자수 ÷ 모집인원 ("N:1" 포맷). 10 이상은 정수, 미만은 소수 1자리.
 * - 목표달성률: (지원자수 ÷ 모집인원) × 100. 0 또는 음수 capacity는 미정의로 처리.
 *
 * 모집인원 부재 → 둘 다 null 반환. UI는 "-"로 표시.
 */

export const competitionRatio = (
  applicants: number,
  capacity: number | null,
): string => {
  if (capacity == null || capacity <= 0) return '-';
  const ratio = applicants / capacity;
  return `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}:1`;
};

export const achievementRate = (
  applicants: number,
  capacity: number | null,
): number | null => {
  if (capacity == null || capacity <= 0) return null;
  return (applicants / capacity) * 100;
};
