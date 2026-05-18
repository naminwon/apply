# 코드넛 채용 지원자 분석 대시보드

사람인·잡코리아·로켓펀치·그룹바이의 공고별 지원자 추이를 시각화하는 단일 페이지 대시보드입니다.

## 주요 기능

- 📊 일자별 누적 지원자 추이 (꺾은선, carry-forward 합산)
- 🎯 직무별·사이트별 비중 분석 (가로 막대, 도넛)
- 📋 공고문 단위 상세 분석 (사이드 패널 + 상세 카드)
- 📅 공고 게시일별 누적 막대 (Stacked Bar)
- 🔍 직무·사이트·기간 동적 필터링 (라디오↔체크박스 자동 변환)
- 🏆 경쟁률·목표달성률·공고 진행률 (모집인원/마감일 입력 시)
- 📤 CSV / PDF 내보내기

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **차트**: Recharts
- **상태관리**: Zustand + TanStack Query
- **스타일**: Tailwind CSS
- **데이터**: Google Sheets + Apps Script Web App

## 시작하기

### 사전 요구사항

- Node.js 20+
- npm 또는 pnpm

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 실제 값 입력
```

### 환경 변수

`.env.local` 파일에 다음 값을 설정합니다.

```env
VITE_API_URL=https://script.google.com/macros/s/{deployment-id}/exec
VITE_API_TOKEN=발급받은-토큰
VITE_USE_MOCK=false
```

개발 초기에는 `VITE_USE_MOCK=true`로 설정하면 `mock-data/api-response.json`을 사용해 API 연결 없이 개발할 수 있습니다.

### 실행

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 프로젝트 구조

```
.
├── CLAUDE.md                     # Claude Code 작업 가이드
├── README.md
├── specs/                        # 설계 문서
│   ├── dashboard-spec.md
│   ├── data-schema.md
│   ├── design-tokens.md
│   └── component-spec.md
├── mock-data/
│   └── api-response.json
├── src/
│   ├── api/
│   │   ├── client.ts             # fetch + mock toggle + 데이터 정규화
│   │   └── types.ts              # JobMaster/JoinedRecord 등 타입 정의
│   ├── components/
│   │   ├── kpi/
│   │   │   └── KPISummary.tsx         # B 영역
│   │   ├── layout/
│   │   │   ├── Header.tsx             # A 영역
│   │   │   └── ExportMenu.tsx         # CSV/PDF 내보내기
│   │   ├── main/
│   │   │   ├── TrendChart.tsx                 # D 영역
│   │   │   ├── JobBreakdownChart.tsx          # E 영역
│   │   │   ├── SiteDistributionChart.tsx      # F 영역
│   │   │   ├── PostingStackedBarChart.tsx     # H 영역
│   │   │   └── PostingDetailCard.tsx          # I-06
│   │   ├── sidepanel/
│   │   │   ├── SidePanel.tsx          # I+C 통합 탭
│   │   │   ├── PostingList.tsx        # I 영역 (검색·정렬·상태 필터)
│   │   │   └── FilterPanel.tsx        # C 영역 (동적 UI)
│   │   └── ui/
│   │       ├── Card.tsx
│   │       └── EmptyState.tsx
│   ├── constants/
│   │   ├── colors.ts             # 사이트·직무 컬러 토큰
│   │   └── enums.ts              # 사이트·직무·상태 enum
│   ├── hooks/
│   │   └── useDashboardData.ts   # React Query 훅
│   ├── stores/
│   │   └── filterStore.ts        # Zustand 필터 스토어
│   ├── utils/
│   │   ├── aggregate.ts          # 공고URL별 MAX(지원자수)
│   │   ├── dateUtils.ts          # D+x, 측정일 범위
│   │   ├── exporters.ts          # CSV 변환·다운로드
│   │   ├── postingMetrics.ts     # 경쟁률·목표달성률
│   │   └── trendData.ts          # TrendChart carry-forward 집계
│   ├── App.tsx
│   ├── index.css                 # Tailwind + 인쇄 스타일
│   └── main.tsx
├── .env.example
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── vite.config.ts                # manualChunks: react/recharts/date-fns
```

## 데이터 소스

Google Sheets에 다음 3개 시트가 있습니다.

- **jobs_master**: 공고 마스터 (17건). 게시일/공고명/사이트/직무구분/공고URL/상태/마감일/모집인원/광고집행/비고
- **applicants_log**: 측정 로그 (60건). 주 2회 누적 지원자 스냅샷
- **sync_log**: 동기화 이력

Apps Script가 두 시트를 「공고URL」 기준으로 JOIN하여 React 앱에 JSON으로 제공합니다. 클라이언트는 응답에서 발견된 직무명 오타(`벡엔드` → `백엔드`)를 API 경계에서 정규화합니다.

자세한 데이터 구조는 [specs/data-schema.md](./specs/data-schema.md)를 참조하세요.

## API 엔드포인트

| 파라미터 | 값 | 설명 |
|---|---|---|
| `token` | 인증 토큰 | 필수 |
| `sheet` | `all` (기본) | 모든 데이터 + JOIN 결과 |
| | `joined` | JOIN된 결과만 |
| | `jobs` | jobs_master만 |
| | `applicants` | applicants_log만 |

예시:
```
GET https://script.google.com/macros/s/{id}/exec?token=xxx&sheet=all
```

## 컬러 시스템

대시보드 전체에서 일관되게 사용하는 컬러 팔레트입니다.

### 사이트 컬러
- 사람인 #378ADD (파랑)
- 잡코리아 #639922 (초록)
- 로켓펀치 #EF9F27 (주황)
- 그룹바이 #7F77DD (보라)

### 직무 컬러
- AI #E24B4A (빨강)
- 백엔드 #639922 (초록)
- 프론트 #378ADD (파랑)
- 기획자 #EF9F27 (노랑)
- 디자이너 #888780 (회색)

자세한 토큰은 [specs/design-tokens.md](./specs/design-tokens.md)를 참조하세요.

## 상태 관리

- **TanStack Query** — 서버 데이터. 5분 staleTime, refetch on focus 비활성화. `useDashboardData()` 훅으로 접근.
- **Zustand** — 전역 필터 상태(`useFilterStore`). graphType/period/customRange/selectedJobs/selectedSites/selectedJobUrl. 라디오로 전환되는 쪽은 첫 항목만 유지.
- **useState** — 컴포넌트 로컬 상태(검색 키워드, 탭, 정렬 키 등).

## 영역 간 연동

| 트리거 | 영향 |
|---|---|
| 공고 카드 클릭 (I-04) | `selectedJobUrl` 토글 → PostingDetailCard 표시, TrendChart 단일 라인 모드 |
| 그래프 분류 변경 (C-01) | 직무·사이트가 라디오↔체크박스 자동 전환 |
| 직무 막대 클릭 (E) | `selectedJobs` = [직무] → TrendChart 재구성 |
| 사이트 도넛 클릭 (F) | `selectedSites` = [사이트] → TrendChart 재구성 |
| 동기화 배지 클릭 (A-03) | React Query `invalidateQueries(['dashboard'])` |

## 빌드 산출물 (대략)

| chunk | size | gzip |
|---|---|---|
| index (앱 코드) | ~116 KB | ~26 KB |
| react | ~142 KB | ~46 KB |
| recharts | ~411 KB | ~111 KB |
| date-fns | ~31 KB | ~9 KB |

## 라이선스

내부용 (코드넛 전용)

## 문의

기획·문서: 민원
개발: (담당자명)
