import type { Site, Job } from './colors';

export const SITES: readonly Site[] = ['사람인', '잡코리아', '로켓펀치', '그룹바이'] as const;
export const JOBS: readonly Job[] = ['AI', '백엔드', '프론트', '기획자', '디자이너'] as const;

export type JobStatus = '운영중' | '마감';
export const JOB_STATUSES: readonly JobStatus[] = ['운영중', '마감'] as const;
