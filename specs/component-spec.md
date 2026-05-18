# 컴포넌트 명세

각 컴포넌트의 props, 내부 상태, 의존성을 정의합니다.

## 디렉토리 매핑

| 영역 | 컴포넌트 | 파일 경로 |
|---|---|---|
| A | Header | `src/components/layout/Header.tsx` |
| B | KPISummary | `src/components/kpi/KPISummary.tsx` |
| I + C | SidePanel | `src/components/sidepanel/SidePanel.tsx` |
| I | PostingList | `src/components/sidepanel/PostingList.tsx` |
| C | FilterPanel | `src/components/sidepanel/FilterPanel.tsx` |
| I-06 | PostingDetailCard | `src/components/main/PostingDetailCard.tsx` |
| D | TrendChart | `src/components/main/TrendChart.tsx` |
| E | JobBreakdownChart | `src/components/main/JobBreakdownChart.tsx` |
| F | SiteDistributionChart | `src/components/main/SiteDistributionChart.tsx` |
| H | PostingStackedBarChart | `src/components/main/PostingStackedBarChart.tsx` |

## 1. Header

```typescript
interface HeaderProps {
  dataRange: { start: string; end: string };
  lastSync: SyncInfo | null;
  onRefresh: () => void;
}
```

- 좌측: 서비스 제목
- 우측: `MIN ~ MAX 측정일` 배지 + 동기화 상태 배지(클릭 시 onRefresh)

## 2. KPISummary

```typescript
interface KPISummaryProps {
  joined: JoinedRecord[];
  jobs: JobMaster[];
}
```

내부 계산:
- `totalApplicants`: 공고별 MAX(지원자수)의 합
- `activeJobCount`: `jobs.filter(j => j.상태 === '운영중').length`
- `activeJobTypes`: 활성 공고의 unique 직무 배열

레이아웃: `grid grid-cols-3 gap-3`

## 3. SidePanel

```typescript
interface SidePanelProps {
  jobs: JobMaster[];
  joined: JoinedRecord[];
}
```

내부 상태:
- `activeTab`: `'posting' | 'filter'` (기본 `'posting'`)

탭 전환 시 자식 컴포넌트 렌더링:
- `posting` → `<PostingList />`
- `filter` → `<FilterPanel />`

## 4. PostingList

```typescript
interface PostingListProps {
  jobs: JobMaster[];
  joined: JoinedRecord[];
}
```

내부 상태:
- `searchKeyword`: string
- `statusFilter`: `'active' | 'closed' | 'all'`

외부 상태(Zustand):
- `selectedJobUrl`: string | null
- `setSelectedJobUrl: (url: string | null) => void`

리스트 아이템 (`PostingCard`):
```typescript
interface PostingCardProps {
  job: JobMaster;
  totalApplicants: number;     // 해당 공고 MAX(지원자수)
  daysSincePost: number;       // (오늘 - 게시일)
  isSelected: boolean;
  onClick: () => void;
}
```

표시 정보:
- 상태 칩 (운영중=파랑, 마감=회색)
- 직무(사이트) — 예: "프론트(사람인)"
- D+x/30
- 누적 지원자

## 5. FilterPanel

Zustand store (`useFilterStore`)에서 직접 상태 가져옴.

```typescript
type GraphType = 'byJob' | 'bySite' | 'total';

interface FilterStore {
  graphType: GraphType;
  period: 'last30' | 'all' | 'last7' | 'custom';
  selectedJobs: Job[];
  selectedSites: Site[];

  setGraphType: (g: GraphType) => void;
  setPeriod: (p: string) => void;
  toggleJob: (j: Job) => void;
  toggleSite: (s: Site) => void;
  reset: () => void;
}
```

**동적 UI 규칙**:
- `graphType === 'byJob'` → 직무는 라디오(단일), 사이트는 체크박스(다중)
- `graphType === 'bySite'` → 직무는 체크박스(다중), 사이트는 라디오(단일)
- `graphType === 'total'` → 둘 다 체크박스(다중)

graphType 변경 시 라디오로 전환되는 쪽은 이전 다중 선택값 중 첫 번째만 유지.

## 6. PostingDetailCard

```typescript
interface PostingDetailCardProps {
  job: JobMaster;
  logs: JoinedRecord[];   // 해당 공고의 모든 측정 로그
}
```

표시 정보:
- 공고명 + 상태 칩
- 게시일, 마감일, 모집인원
- 누적 지원자, 경쟁률, 일평균 유입, 광고집행
- 진행 프로그레스 바 (마감일 입력 시)

선택된 공고가 없으면 컴포넌트 미렌더링.

## 7. TrendChart

```typescript
interface TrendChartProps {
  joined: JoinedRecord[];
}
```

Zustand에서 가져올 값:
- `graphType`, `selectedJobs`, `selectedSites`, `period`, `selectedJobUrl`

로직:
1. `selectedJobUrl`이 있으면 → 해당 공고만 단일 라인
2. 없으면 → graphType에 따라 GROUP BY
   - `byJob`: 선택된 직무 1개 × 선택된 사이트 N개 = N개 라인 (사이트 컬러)
   - `bySite`: 선택된 사이트 1개 × 선택된 직무 N개 = N개 라인 (직무 컬러)
   - `total`: 선택 범위 전체 합산 → 1개 라인 (회색)

Recharts 사용:
```tsx
<LineChart data={chartData}>
  <XAxis dataKey="측정일" />
  <YAxis />
  <Tooltip />
  <Legend />
  {series.map(s => (
    <Line key={s.name} dataKey={s.name} stroke={s.color} strokeWidth={2} />
  ))}
</LineChart>
```

## 8. JobBreakdownChart

```typescript
interface JobBreakdownChartProps {
  joined: JoinedRecord[];
  onJobClick: (job: Job) => void;
}
```

로직:
- 직무별로 공고별 MAX(지원자수) 합계 산출
- 내림차순 정렬
- 직무 컬러 적용

Recharts 사용:
```tsx
<BarChart layout="vertical" data={sortedData}>
  <XAxis type="number" />
  <YAxis type="category" dataKey="직무" />
  <Bar dataKey="지원자수">
    {sortedData.map(entry => (
      <Cell key={entry.직무} fill={getJobColor(entry.직무)} />
    ))}
  </Bar>
</BarChart>
```

막대 클릭 시 `onJobClick(직무)` 호출.

## 9. SiteDistributionChart

```typescript
interface SiteDistributionChartProps {
  joined: JoinedRecord[];
  onSiteClick: (site: Site) => void;
}
```

로직:
- 사이트별 공고별 MAX(지원자수) 합계
- 도넛 차트 + 범례에 퍼센트 표시

Recharts `PieChart` + `Cell`로 색상 지정.

## 10. PostingStackedBarChart

```typescript
interface PostingStackedBarChartProps {
  joined: JoinedRecord[];
}
```

내부 상태:
- `selectedJobType`: Job (기본: 첫 번째 활성 직무)

로직:
1. `selectedJobType`에 해당하는 공고만 필터
2. 공고별 최종 지원자수 (MAX 측정일 기준)
3. [게시일 × 사이트] GROUP BY → SUM

```typescript
// 데이터 예시
[
  { 게시일: '2026-01-30', 사람인: 423, 잡코리아: 224, 로켓펀치: 0, 그룹바이: 0 },
  { 게시일: '2026-05-12', 사람인: 42, 잡코리아: 25, 로켓펀치: 2, 그룹바이: 0 },
]
```

Recharts:
```tsx
<BarChart data={stackData}>
  <XAxis dataKey="게시일" />
  <YAxis />
  <Bar dataKey="사람인" stackId="site" fill={SITE_COLORS.사람인} />
  <Bar dataKey="잡코리아" stackId="site" fill={SITE_COLORS.잡코리아} />
  <Bar dataKey="로켓펀치" stackId="site" fill={SITE_COLORS.로켓펀치} />
  <Bar dataKey="그룹바이" stackId="site" fill={SITE_COLORS.그룹바이} />
</BarChart>
```

## 11. 공통 UI 컴포넌트 (제안)

| 컴포넌트 | 용도 |
|---|---|
| `<Chip />` | 상태/직무/사이트 라벨 |
| `<Badge />` | KPI 변화량, 카운트 |
| `<Card />` | 모든 위젯 컨테이너 |
| `<EmptyState />` | 데이터 없음 메시지 |
| `<Tabs />` | 사이드 패널 탭 |

## 12. 영역 간 연동 매트릭스

| 트리거 | 영향받는 영역 |
|---|---|
| I-04 공고 클릭 | I-06 표시, D 단일 라인 모드 |
| C-01 그래프 분류 변경 | C-03, C-04 UI 변환, D 라인 재구성 |
| C-02 기간 변경 | D X축 범위 변경 |
| C-03 직무 선택 변경 | D 라인 재구성 |
| C-04 사이트 선택 변경 | D 라인 재구성 |
| E 막대 클릭 | C-03 동기화, D 필터링 |
| F 도넛 조각 클릭 | C-04 동기화, D 필터링 |
| H 직무 드롭다운 | H 차트만 변경 (다른 영역 영향 없음) |
| A-03 동기화 클릭 | React Query refetch → 전체 재렌더링 |

## 13. 상태 관리 가이드

### Zustand 사용 (전역 필터)
```typescript
// src/stores/filterStore.ts
import { create } from 'zustand';

export const useFilterStore = create<FilterStore>((set) => ({
  graphType: 'byJob',
  period: 'last30',
  selectedJobs: ['프론트'],
  selectedSites: ['사람인', '잡코리아', '로켓펀치'],
  selectedJobUrl: null,

  setGraphType: (g) => set({ graphType: g }),
  toggleJob: (j) => set(state => ({
    selectedJobs: state.selectedJobs.includes(j)
      ? state.selectedJobs.filter(x => x !== j)
      : [...state.selectedJobs, j]
  })),
  // ...
}));
```

### React Query 사용 (서버 데이터)
```typescript
// src/hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../api/client';

export const useDashboardData = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
  });
```

### 로컬 상태 (useState)
- 검색 키워드, 탭 활성화, 드롭다운 펼침 등 컴포넌트 내부 상태만
