# 디자인 토큰

대시보드 전체에서 사용하는 디자인 토큰입니다. 이 토큰은 `tailwind.config.js`와 `src/constants/colors.ts`에 등록되어야 합니다.

## 1. 컬러 — 사이트

| 사이트 | Hex | Tailwind 토큰 명 | 용도 |
|---|---|---|---|
| 사람인 | `#378ADD` (파랑) | `site-saramin` | 도넛, Stacked Bar, 사이트별 라인 |
| 잡코리아 | `#639922` (초록) | `site-jobkorea` | 도넛, Stacked Bar, 사이트별 라인 |
| 로켓펀치 | `#EF9F27` (주황) | `site-rocketpunch` | 도넛, Stacked Bar, 사이트별 라인 |
| 그룹바이 | `#7F77DD` (보라) | `site-groupby` | 향후 데이터 추가 시 |

## 2. 컬러 — 직무

| 직무 | Hex | Tailwind 토큰 명 | 용도 |
|---|---|---|---|
| AI | `#E24B4A` (빨강) | `job-ai` | 직무별 막대, 직무별 라인, 칩 |
| 백엔드 | `#639922` (초록) | `job-backend` | 직무별 막대, 직무별 라인, 칩 |
| 프론트 | `#378ADD` (파랑) | `job-frontend` | 직무별 막대, 직무별 라인, 칩 |
| 기획자 | `#EF9F27` (노랑) | `job-planner` | 직무별 막대, 직무별 라인, 칩 |
| 디자이너 | `#888780` (회색) | `job-designer` | 직무별 막대, 직무별 라인, 칩 |

> ⚠️ **사이트 컬러와 직무 컬러에서 일부 색상이 중복(파랑·초록·주황)됩니다.** 한 그래프 안에서는 사이트 OR 직무 중 하나의 분류 기준에만 컬러를 사용해야 합니다.

## 3. 컬러 — UI 기본

| 용도 | Hex | Tailwind 토큰 명 |
|---|---|---|
| Primary (헤더, 강조) | `#2E5C8A` | `primary` |
| 배경 (기본) | `#FFFFFF` | `bg-base` |
| 배경 (보조) | `#F5F5F5` | `bg-subtle` |
| 보더 | `#E5E5E2` | `border-default` |
| 텍스트 (기본) | `#1A1A1A` | `text-primary` |
| 텍스트 (보조) | `#444441` | `text-secondary` |
| 텍스트 (희미) | `#888780` | `text-tertiary` |

## 4. 컬러 — 상태

| 상태 | Hex | 사용처 |
|---|---|---|
| 진행중 (Active) | `#378ADD` (파랑) | 공고 상태 칩 |
| 종료 (Closed) | `#888780` (회색) | 공고 상태 칩 |
| 성공 | `#639922` (초록) | 동기화 성공 |
| 경고 | `#EF9F27` (주황) | 데이터 누락 알림 |
| 오류 | `#E24B4A` (빨강) | API 실패 |

## 5. 타이포그래피

| 용도 | Size | Weight | Line Height |
|---|---|---|---|
| Heading 1 (페이지 제목) | 24px | 600 | 1.3 |
| Heading 2 (영역 제목) | 16px | 500 | 1.4 |
| Heading 3 (카드 제목) | 14px | 500 | 1.4 |
| Body | 13px | 400 | 1.5 |
| Caption | 11px | 400 | 1.4 |
| Number (KPI) | 28px | 500 | 1.2 |

**Font Family**: 시스템 폰트 우선 (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif`)

## 6. Spacing

Tailwind 기본값 사용:
- `space-1` = 4px
- `space-2` = 8px
- `space-3` = 12px
- `space-4` = 16px
- `space-6` = 24px
- `space-8` = 32px

## 7. Border Radius

| 토큰 | 값 | 용도 |
|---|---|---|
| `rounded-sm` | 4px | 칩, 작은 버튼 |
| `rounded-md` | 8px | 카드, 패널 |
| `rounded-lg` | 12px | 메인 컨테이너 |
| `rounded-full` | 9999px | 도넛, 원형 |

## 8. 그림자

| 토큰 | 값 | 용도 |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 카드 |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | 호버 시 |

## 9. tailwind.config.js 예시

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 사이트
        'site-saramin': '#378ADD',
        'site-jobkorea': '#639922',
        'site-rocketpunch': '#EF9F27',
        'site-groupby': '#7F77DD',
        // 직무
        'job-ai': '#E24B4A',
        'job-backend': '#639922',
        'job-frontend': '#378ADD',
        'job-planner': '#EF9F27',
        'job-designer': '#888780',
        // UI
        primary: '#2E5C8A',
        'bg-subtle': '#F5F5F5',
        'border-default': '#E5E5E2',
        'text-primary': '#1A1A1A',
        'text-secondary': '#444441',
        'text-tertiary': '#888780',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

## 10. constants/colors.ts 예시

```typescript
// src/constants/colors.ts

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

/**
 * 사이트명을 받아 컬러 코드 반환
 * 알 수 없는 사이트는 기본 회색 반환
 */
export const getSiteColor = (site: string): string =>
  SITE_COLORS[site as Site] ?? '#888780';

/**
 * 직무명을 받아 컬러 코드 반환
 * 알 수 없는 직무는 기본 회색 반환
 */
export const getJobColor = (job: string): string =>
  JOB_COLORS[job as Job] ?? '#888780';
```
