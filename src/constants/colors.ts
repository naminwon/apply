export const SITE_COLORS = {
  사람인: '#378ADD',
  잡코리아: '#639922',
  로켓펀치: '#EF9F27',
  그룹바이: '#7F77DD',
} as const;

export const JOB_COLORS = {
  AI: '#E24B4A',
  백엔드: '#639922',
  프론트: '#378ADD',
  기획자: '#EF9F27',
  디자이너: '#888780',
} as const;

export type Site = keyof typeof SITE_COLORS;
export type Job = keyof typeof JOB_COLORS;

const FALLBACK_COLOR = '#888780';

export const getSiteColor = (site: string): string =>
  SITE_COLORS[site as Site] ?? FALLBACK_COLOR;

export const getJobColor = (job: string): string =>
  JOB_COLORS[job as Job] ?? FALLBACK_COLOR;
