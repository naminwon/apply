# CLAUDE.md

이 문서는 Claude Code가 작업 시 항상 참조해야 하는 핵심 컨텍스트입니다.

## 프로젝트 개요

**코드넛 채용 지원자 분석 대시보드**는 사람인·잡코리아·로켓펀치·그룹바이의 공고별 지원자 추이를 시각화하는 단일 페이지 대시보드입니다.

- 대상 사용자: 채용 담당자, HR 매니저, 경영진
- 데이터 출처: Google Sheets (Apps Script JSON API 경유)
- 배포 형태: SPA (Single Page Application)

## 기술 스택 (확정)

| 영역 | 라이브러리 | 비고 |
|---|---|---|
| 프레임워크 | React 18 + Vite | TypeScript 사용 |
| 차트 | Recharts | 꺾은선, 막대, 도넛, Stacked Bar 모두 사용 |
| 상태관리 | Zustand | 필터 상태 관리 |
| 데이터 페칭 | TanStack Query (React Query) | 5분 캐싱 |
| 스타일 | Tailwind CSS | 컬러 토큰 등록 필수 |
| 날짜 처리 | date-fns | 30일 윈도우, D+x 계산 |
| 아이콘 | lucide-react | 표준 |

## 핵심 디자인 원칙

1. **컬러 시스템 엄수**: `specs/design-tokens.md`의 사이트·직무 컬러를 반드시 사용. 임의의 색상 사용 금지.
2. **한 그래프에 한 분류 컬러만**: 사이트 컬러와 직무 컬러가 일부 중복(파랑·초록·주황)되므로, 한 그래프 안에서는 사이트 OR 직무 중 하나의 분류 기준에만 컬러를 사용.
3. **필터 동적 UI**: 「그래프 분류」 드롭다운 선택에 따라 직무·사이트가 라디오↔체크박스로 변환됨. (specs/dashboard-spec.md 7장 참조)
4. **공고는 URL이 식별자**: applicants_log의 「공고명」에 포함된 URL을 추출해 jobs_master와 JOIN. 서버에서 이미 JOIN된 결과를 받으므로 클라이언트는 `data.joined` 사용.

## 데이터 흐름

```
Google Sheets (jobs_master, applicants_log, sync_log)
       ↓
Apps Script doGet() — JOIN 처리 후 JSON 반환
       ↓
React Query — 5분 캐싱
       ↓
Zustand store — 필터 상태
       ↓
컴포넌트 — Recharts로 시각화
```

## 폴더 구조 (권장)

```
src/
├── api/
│   ├── client.ts              # fetch wrapper (token 자동 첨부)
│   └── types.ts               # API 응답 타입 정의
├── stores/
│   └── filterStore.ts         # Zustand: 필터 상태
├── hooks/
│   ├── useDashboardData.ts    # React Query 훅
│   └── useFilteredData.ts     # 필터 적용된 데이터 셀렉터
├── components/
│   ├── layout/
│   │   ├── Header.tsx                  # A 영역
│   │   └── DashboardLayout.tsx
│   ├── kpi/
│   │   └── KPISummary.tsx              # B 영역
│   ├── sidepanel/
│   │   ├── SidePanel.tsx               # I + C 통합 (탭)
│   │   ├── PostingList.tsx             # I 영역
│   │   └── FilterPanel.tsx             # C 영역
│   ├── main/
│   │   ├── PostingDetailCard.tsx       # I-06
│   │   ├── TrendChart.tsx              # D 영역 (꺾은선)
│   │   ├── JobBreakdownChart.tsx       # E 영역 (가로 막대)
│   │   ├── SiteDistributionChart.tsx   # F 영역 (도넛)
│   │   └── PostingStackedBarChart.tsx  # H 영역
│   └── ui/                              # 공통 UI 컴포넌트
├── constants/
│   ├── colors.ts              # 사이트/직무 컬러 토큰
│   └── enums.ts               # 사이트, 직무 enum
├── utils/
│   ├── aggregate.ts           # GROUP BY, SUM 등 집계 함수
│   └── dateUtils.ts           # 30일 윈도우, D+x 계산
└── App.tsx
```

## 필수 환경 변수

`.env.local` 파일에 다음을 설정:

```
VITE_API_URL=https://script.google.com/macros/s/{deployment-id}/exec
VITE_API_TOKEN=codnut-apply-dashboard-1984-1592
```

`.env.example`를 템플릿으로 제공함. 실제 값은 `.gitignore`에 포함된 `.env.local`에 작성.

## 개발/검증 가이드

- **Mock 데이터로 우선 개발**: `mock-data/api-response.json`을 사용하면 API 연결 없이 UI 개발 가능. `src/api/client.ts`에 `USE_MOCK=true` 분기를 두는 것을 권장.
- **타입 안정성**: API 응답은 반드시 `src/api/types.ts`에 정의된 타입으로 받기.
- **컬러는 토큰으로**: `text-blue-500` 같은 Tailwind 기본 색상 대신 `text-site-saramin` 같은 커스텀 토큰을 사용 (tailwind.config 등록).

## 우선 구현 순서 (Phase 1)

1. 프로젝트 셋업 (Vite + React + TS + Tailwind + Recharts)
2. `constants/colors.ts`, `tailwind.config.js` 컬러 토큰 등록
3. `api/client.ts` + mock 데이터 연동
4. `stores/filterStore.ts` 필터 상태 정의
5. `Header` + `KPISummary` (B 영역)
6. `SidePanel` 탭 구조 + `PostingList` (I 영역)
7. `FilterPanel` 동적 UI (C 영역)
8. `TrendChart` (D 영역) — 가장 핵심
9. `JobBreakdownChart`, `SiteDistributionChart` (E, F 영역)
10. `PostingStackedBarChart` (H 영역)
11. 영역 간 연동 (E 막대 클릭 → 필터, 공고 클릭 → 메인 그래프)

## 참고 문서

- `specs/dashboard-spec.md` — 화면 설계서 (가장 상세)
- `specs/data-schema.md` — 데이터 구조 및 API 응답
- `specs/design-tokens.md` — 컬러·간격·타이포 토큰
- `specs/component-spec.md` — 컴포넌트별 props/state 명세

## 주의 사항

- **CORS 이슈**: Apps Script 배포 시 "액세스: 모든 사용자"로 설정되어 있어야 함. 만약 fetch 실패 시 권한 확인.
- **HTTP status code**: Apps Script는 항상 200을 반환하므로 에러는 응답 body의 `success` 필드로 판단할 것.
- **날짜 형식**: API는 `yyyy-MM-dd` 문자열로 반환. `new Date()`로 변환 후 사용.
- **지원자수는 누적값**: 동일 공고의 측정일별 값은 단조증가. 그래프는 누적 형태로만 표시.
