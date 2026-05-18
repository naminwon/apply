import type {
  ApiResponse,
  ApiResponseError,
  ApplicantLog,
  Job,
  JobMaster,
  JoinedRecord,
  SheetParam,
  SyncInfo,
} from './types';
import mockData from '../../mock-data/api-response.json';

const useMock = (): boolean => import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  constructor(
    message: string,
    public code:
      | 'AUTH_FAILED'
      | 'INVALID_PARAM'
      | 'SERVER_ERROR'
      | 'NETWORK_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ===== Normalization helpers =====

/** 시트/스크립트의 직무구분 오타 흡수. */
const normalizeJobName = (job: unknown): Job =>
  (job === '벡엔드' ? '백엔드' : job) as Job;

/**
 * 날짜를 yyyy-MM-dd로 통일:
 *   "2026-01-02"                    → "2026-01-02"
 *   "2026-01-02T08:00:00.000Z"      → "2026-01-02"   (Apps Script Date.toJSON)
 *   Date 객체                       → ISO Day
 *   "", null, 잘못된 형식           → null
 */
const normalizeDate = (raw: unknown): string | null => {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : isoDay(raw);
  }
  if (typeof raw === 'string') {
    if (raw.length >= 10 && raw[4] === '-' && raw[7] === '-') {
      return raw.slice(0, 10);
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : isoDay(d);
  }
  return null;
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const normalizeOptionalString = (raw: unknown): string | null => {
  if (raw == null) return null;
  if (typeof raw !== 'string') return String(raw);
  const t = raw.trim();
  return t === '' ? null : t;
};

/** 빈/잘못된 값 → null. "1,000,000" 같은 콤마 표기도 흡수. */
const normalizeOptionalNumber = (raw: unknown): number | null => {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw.replace(/[,\s]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const URL_IN_TITLE = /\((https?:\/\/[^)]+)\)/;
const extractUrlFromTitle = (text: string | undefined): string | null => {
  if (!text) return null;
  const m = text.match(URL_IN_TITLE);
  return m ? m[1] : null;
};

// ===== Record normalizers =====

type RawObj = Record<string, unknown>;

const normalizeJobRow = (raw: RawObj): JobMaster => ({
  게시일: normalizeDate(raw.게시일) ?? '',
  공고명: String(raw.공고명 ?? ''),
  사이트: raw.사이트 as JobMaster['사이트'],
  직무구분: normalizeJobName(raw.직무구분),
  공고URL: String(raw.공고URL ?? ''),
  상태: raw.상태 as JobMaster['상태'],
  마감일: normalizeDate(raw.마감일),
  모집인원: normalizeOptionalNumber(raw.모집인원),
  광고집행: normalizeOptionalNumber(raw.광고집행),
  비고: normalizeOptionalString(raw.비고),
});

const normalizeApplicantRow = (raw: RawObj): ApplicantLog => ({
  log_id: String(raw.log_id ?? ''),
  지원자수: Number(raw.지원자수) || 0,
  게시일: normalizeDate(raw.게시일) ?? '',
  측정일: normalizeDate(raw.측정일) ?? '',
  공고명: String(raw.공고명 ?? ''),
  사이트: raw.사이트 as ApplicantLog['사이트'],
  직무구분: normalizeJobName(raw.직무구분),
  비고: normalizeOptionalString(raw.비고),
});

/**
 * 공고명에서 URL을 추출 → jobs_master와 JOIN.
 * Apps Script가 joined를 안 줘도, 또는 잘못된 shape으로 줘도 클라이언트에서 일관 생성.
 */
const computeJoined = (
  applicants: ApplicantLog[],
  jobs: JobMaster[],
): JoinedRecord[] => {
  const byUrl = new Map(jobs.map((j) => [j.공고URL, j]));
  return applicants.map((a) => {
    const url = extractUrlFromTitle(a.공고명);
    const matched = url ? byUrl.get(url) ?? null : null;
    return {
      ...a,
      공고URL: url,
      상태: matched?.상태 ?? null,
      광고집행: matched?.광고집행 ?? null,
    };
  });
};

/**
 * 라이브 / mock 응답을 strict한 ApiResponse로 정규화.
 *   - ISO timestamp → yyyy-MM-dd
 *   - "" → null
 *   - 누락 컬럼(마감일/모집인원/광고집행 number) → null
 *   - 벡엔드 → 백엔드
 *   - joined는 항상 클라이언트에서 재계산
 */
const normalize = (raw: unknown): ApiResponse => {
  const r = raw as RawObj | null;
  if (!r || r.success !== true) {
    return (
      (r as unknown as ApiResponseError) ?? {
        success: false,
        error: '응답이 비어있습니다',
        errorCode: 'SERVER_ERROR',
      }
    );
  }
  const data = (r.data ?? {}) as RawObj;
  const jobs = ((data.jobs as RawObj[]) ?? []).map(normalizeJobRow);
  const applicants = ((data.applicants as RawObj[]) ?? []).map(
    normalizeApplicantRow,
  );
  const joined = computeJoined(applicants, jobs);
  return {
    success: true,
    data: {
      jobs,
      applicants,
      joined,
      lastSync: (data.lastSync as SyncInfo | null) ?? null,
    },
    timestamp: (r.timestamp as string) ?? new Date().toISOString(),
  };
};

// ===== Public API =====

export const fetchDashboardData = async (
  sheet: SheetParam = 'all',
): Promise<ApiResponse> => {
  if (useMock()) {
    return normalize(mockData);
  }

  const baseUrl = import.meta.env.VITE_API_URL;
  const token = import.meta.env.VITE_API_TOKEN;

  if (!baseUrl || !token) {
    throw new ApiError(
      'VITE_API_URL 또는 VITE_API_TOKEN이 설정되지 않았습니다.',
      'SERVER_ERROR',
    );
  }

  const url = `${baseUrl}?token=${encodeURIComponent(token)}&sheet=${sheet}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new ApiError(
      `네트워크 오류: ${e instanceof Error ? e.message : String(e)}`,
      'NETWORK_ERROR',
    );
  }
  const body = (await res.json()) as unknown;
  return normalize(body);
};

/**
 * React Query에서 success:false를 에러 상태로 인식하도록 throw 변형.
 */
export const fetchDashboardDataOrThrow = async (
  sheet: SheetParam = 'all',
) => {
  const body = await fetchDashboardData(sheet);
  if (!body.success) {
    throw new ApiError(body.error, body.errorCode);
  }
  return body.data;
};
