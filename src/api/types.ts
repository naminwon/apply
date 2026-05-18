export type Site = '사람인' | '잡코리아' | '로켓펀치' | '그룹바이';
export type Job = 'AI' | '백엔드' | '프론트' | '기획자' | '디자이너';
export type JobStatus = '운영중' | '마감';

export interface JobMaster {
  게시일: string;
  공고명: string;
  사이트: Site;
  직무구분: Job;
  공고URL: string;
  상태: JobStatus;
  마감일: string | null;
  모집인원: number | null;
  /** Phase 2 — 광고비용 (원). null = 미집행. (data-schema 원본은 string이었으나 ROI 분석을 위해 number로 확장) */
  광고집행: number | null;
  비고: string | null;
}

export interface ApplicantLog {
  log_id: string;
  지원자수: number;
  게시일: string;
  측정일: string;
  공고명: string;
  사이트: Site;
  직무구분: Job;
  비고: string | null;
}

export interface JoinedRecord extends ApplicantLog {
  공고URL: string | null;
  상태: JobStatus | null;
  광고집행: number | null;
}

export interface SyncInfo {
  sync_id: string;
  sync_time: string;
  status: 'SUCCESS' | 'FAILED';
  records_count: number;
}

export interface ApiResponseSuccess {
  success: true;
  data: {
    applicants: ApplicantLog[];
    jobs: JobMaster[];
    joined: JoinedRecord[];
    lastSync: SyncInfo | null;
  };
  timestamp: string;
}

export interface ApiResponseError {
  success: false;
  error: string;
  errorCode: 'AUTH_FAILED' | 'INVALID_PARAM' | 'SERVER_ERROR';
}

export type ApiResponse = ApiResponseSuccess | ApiResponseError;

export type SheetParam = 'all' | 'joined' | 'jobs' | 'applicants' | 'sync';
