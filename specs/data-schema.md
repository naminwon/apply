# 데이터 스키마 & API 명세

## 1. 데이터 출처

Google Sheets > Apps Script Web App을 통해 JSON으로 제공됩니다.

### Apps Script Web App URL

```
https://script.google.com/macros/s/{deployment-id}/exec
```

### 인증

URL 파라미터로 토큰 전달:
```
?token=codnut-apply-dashboard-1984-1592
```

## 2. 시트 구조

### 2.1 jobs_master (공고 마스터)

공고 단위의 정보. `공고URL`이 Primary Key 역할.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| 게시일 | Date (`yyyy-MM-dd`) | Y | 공고 게시일 |
| 공고명 | String | Y | 공고 제목 |
| 사이트 | Enum | Y | `사람인` / `잡코리아` / `로켓펀치` / `그룹바이` |
| 직무구분 | Enum | Y | `AI` / `백엔드` / `프론트` / `기획자` / `디자이너` |
| 공고URL | String | Y (PK) | 사이트별 URL 그대로 |
| 상태 | Enum | Y | `운영중` / `마감` |
| 마감일 | Date (`yyyy-MM-dd`) | N | 공고 마감 예정일. 미입력 시 진행률 미산정 (Phase 2) |
| 모집인원 | Integer | N | 모집 인원수. 입력 시 경쟁률·목표달성률 산정 (Phase 2) |
| 광고집행 | Integer | N | 광고비(원). null = 미집행. ROI 분석에 사용 (Phase 2 — 원본 spec의 String에서 number로 확장) |
| 비고 | String | N | 자유 메모 |

**현재 데이터: 17건**

### 2.2 applicants_log (측정 로그)

주 2회 측정되는 지원자 누적 스냅샷. `공고명`의 URL을 추출해 `jobs_master`와 JOIN.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| log_id | String | Y (PK) | 측정 로그 고유 ID. 예: `20260130_[신입/경력] 코드넛...` |
| 지원자수 | Integer | Y | 측정일 시점의 누적 지원자 수 |
| 게시일 | Date | Y | 공고 게시일 (jobs_master와 동일 값) |
| 측정일 | Date | Y | 스냅샷 측정일 |
| 공고명 | String | Y | 공고 제목 + (URL) 결합 형태 |
| 사이트 | Enum | Y | 사이트명 |
| 직무구분 | Enum | Y | 직무명 |
| 비고 | String | N | 자유 메모 |

**현재 데이터: 60건**

> ⚠️ `공고명` 필드에 `(https://...)` 형태로 URL이 포함되어 있습니다. Apps Script가 이를 추출해 `jobs_master`와 JOIN합니다.

### 2.3 sync_log (동기화 이력)

| 필드 | 타입 | 설명 |
|---|---|---|
| sync_id | String | 동기화 ID |
| sync_time | DateTime | 동기화 실행 시각 |
| status | Enum | `SUCCESS` / `FAILED` |
| records_count | Integer | 처리된 레코드 수 |

## 3. API 엔드포인트

### 3.1 GET /exec

#### 파라미터

| 파라미터 | 값 | 기본값 | 설명 |
|---|---|---|---|
| `token` | string | (필수) | 인증 토큰 |
| `sheet` | `all` | ✓ | 모든 데이터 + JOIN 결과 |
| | `joined` | | JOIN된 결과만 |
| | `jobs` | | jobs_master만 |
| | `applicants` | | applicants_log만 |
| | `sync` | | sync_log만 |

#### 응답 (성공)

```json
{
  "success": true,
  "data": {
    "applicants": [ /* applicants_log 원본 */ ],
    "jobs": [ /* jobs_master 원본 */ ],
    "joined": [ /* JOIN된 결과 */ ],
    "lastSync": { /* sync_log 최신 항목 */ }
  },
  "timestamp": "2026-05-14T14:00:00+09:00"
}
```

#### 응답 (실패)

```json
{
  "success": false,
  "error": "Unauthorized",
  "errorCode": "AUTH_FAILED"
}
```

**errorCode 종류**:
- `AUTH_FAILED` — 토큰 불일치
- `INVALID_PARAM` — sheet 파라미터 값이 잘못됨
- `SERVER_ERROR` — 그 외 서버 오류

> ⚠️ Apps Script는 HTTP 상태 코드를 변경할 수 없습니다. 모든 응답이 HTTP 200으로 반환되므로, 클라이언트는 응답 body의 `success` 필드로 에러를 판단해야 합니다.

## 4. JOIN 결과 (joined)

`applicants_log`의 공고명에서 URL을 추출하여 `jobs_master`와 JOIN한 결과입니다. 대시보드의 주된 데이터셋입니다.

```typescript
type JoinedRecord = {
  // applicants_log 원본
  log_id: string;
  측정일: string;        // "2026-01-30"
  지원자수: number;
  공고명: string;        // URL 포함 형태
  사이트: Site;
  직무구분: Job;

  // 추출/JOIN된 필드
  공고URL: string | null;
  게시일: string;
  상태: '운영중' | '마감' | null;
  광고집행: string | null;
};
```

### JOIN 샘플 (실제 데이터)

```json
{
  "log_id": "20260130_[신입/경력] 코드넛과 함께 성장할 AI개발자를 찾고 있습니다.",
  "측정일": "2026-01-30",
  "지원자수": 98,
  "공고명": "[신입/경력] 코드넛과 함께 성장할 AI개발자를 찾고 있습니다. (https://www.saramin.co.kr/...)",
  "사이트": "사람인",
  "직무구분": "AI",
  "공고URL": "https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=52710802",
  "게시일": "2026-01-02",
  "상태": "마감",
  "광고집행": 1000000
}
```

## 5. TypeScript 타입 정의

`src/api/types.ts`에 다음과 같이 정의합니다:

```typescript
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
  마감일: string | null;        // Phase 2
  모집인원: number | null;       // Phase 2
  광고집행: number | null;       // Phase 2 — 광고비(원)
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
  광고집행: number | null;       // Phase 2 — 광고비(원)
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
```

## 6. 데이터 가공 규칙

### 6.1 KPI 계산

| 지표 | 산출 |
|---|---|
| 코드넛 누적 지원자 (B-01) | `Σ(applicants_log.지원자수)` 전체 합. 행 추가 시마다 자동 갱신. period 필터 무관 |
| 활성 공고 수 (B-02) | `jobs.filter(j => j.상태 === '운영중').length` |
| 진행 중인 직무 (B-03) | `[...new Set(activeJobs.map(j => j.직무구분))]` |

### 6.2 메인 그래프 (D) — 측정일 누적 단순 합

각 측정일 D에 대해, **측정일 ≤ D 인 모든 행**을 series key(사이트 또는 직무)별로
누적 합산. 라인은 새 측정이 들어올 때마다 단조 증가.

예)
- `1월 30일 사람인` = (측정일 ≤ 1/30, 사이트=사람인) 지원자수 합 = 471
- `2월 3일  사람인` = (측정일 ≤ 2/3,  사이트=사람인) 지원자수 합 (= 471 + 2/3 사람인 그날 합)

```typescript
// 1) displayDates = 모든 측정일 합집합 ∩ period 윈도우
// 2) graphType별 pool 필터:
//    'site' → selectedJobs 합산, 사이트별 라인
//    'job'  → selectedSites 합산, 직무별 라인
//    total → 선택 전체 합산 라인 1개
// 3) 각 D 시점 값 = (그날까지의 perDate 합의 running total)
const running = {};
for (const D of displayDates) {
  for (const r of pool) if (r.측정일 === D) running[keyOf(r)] += r.지원자수;
  push({ 측정일: D, ...running });
}
```

> 구현: `src/utils/trendData.ts`. 직무·사이트는 multi-select. 모든 graphType이
> 다중 선택을 지원하며, 단일 선택 강제(라디오)는 폐기됨.

### 6.3 30일 윈도우

```typescript
import { subDays, parseISO } from 'date-fns';

const maxDate = max(joined.map(r => parseISO(r.측정일)));
const minDate = subDays(maxDate, 30);
const windowed = joined.filter(r => parseISO(r.측정일) >= minDate);
```

### 6.4 공고별 최종 지원자 (H 영역)

```typescript
// 공고URL별 최신 측정일의 지원자수
const latestByJob = joined.reduce((acc, r) => {
  if (!r.공고URL) return acc;
  if (!acc[r.공고URL] || acc[r.공고URL].측정일 < r.측정일) {
    acc[r.공고URL] = r;
  }
  return acc;
}, {} as Record<string, JoinedRecord>);

// 게시일 × 사이트 그룹
const stackData = Object.values(latestByJob).reduce((acc, r) => {
  const key = r.게시일;
  if (!acc[key]) acc[key] = { 게시일: key, 사람인: 0, 잡코리아: 0, 로켓펀치: 0, 그룹바이: 0 };
  acc[key][r.사이트] += r.지원자수;
  return acc;
}, {} as Record<string, any>);
```

## 7. Mock 데이터

개발 환경에서는 `mock-data/api-response.json`을 사용합니다. 실제 API와 동일한 구조를 가지므로 환경 변수 `VITE_USE_MOCK=true`로 토글하면 바로 사용 가능합니다.

```typescript
// src/api/client.ts (예시)
import mockData from '../../mock-data/api-response.json';

export const fetchDashboardData = async (): Promise<ApiResponse> => {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return mockData as ApiResponse;
  }
  const url = `${import.meta.env.VITE_API_URL}?token=${import.meta.env.VITE_API_TOKEN}&sheet=all`;
  const res = await fetch(url);
  return res.json();
};
```
