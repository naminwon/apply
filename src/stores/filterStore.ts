import { create } from 'zustand';
import type { Job, Site } from '../api/types';

/**
 * TrendChart 표시 모드. 값이 곧 "라인 단위":
 *   'site' → 사이트별 라인 (선택 직무 합산)
 *   'job'  → 직무별 라인 (선택 사이트 합산)
 *   'total' → 합산 1개 라인
 */
export type GraphType = 'site' | 'job' | 'total';
export type Period = 'all' | 'custom';

export interface FilterState {
  graphType: GraphType;
  period: Period;
  // period === 'custom'일 때만 사용. yyyy-MM-dd.
  customStart: string | null;
  customEnd: string | null;
  selectedJobs: Job[];
  selectedSites: Site[];
  selectedGroupDate: string | null;
}

export interface FilterActions {
  setGraphType: (g: GraphType) => void;
  setPeriod: (p: Period) => void;
  setCustomRange: (start: string | null, end: string | null) => void;
  toggleJob: (j: Job) => void;
  toggleSite: (s: Site) => void;
  setSelectedJobs: (jobs: Job[]) => void;
  setSelectedSites: (sites: Site[]) => void;
  setSelectedGroupDate: (date: string | null) => void;
  reset: () => void;
}

const DEFAULTS: FilterState = {
  graphType: 'site',
  period: 'all',
  customStart: null,
  customEnd: null,
  // 기본은 모든 직무·사이트 선택. 'site' 모드 = 선택된 직무 합산 후 사이트별 라인.
  selectedJobs: ['AI', '백엔드', '프론트', '기획자', '디자이너'],
  selectedSites: ['사람인', '잡코리아', '로켓펀치', '그룹바이'],
  selectedGroupDate: null,
};

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...DEFAULTS,
  // 모든 graphType이 multi-select로 통일됨 (라디오 제약 제거).
  setGraphType: (g) => set({ graphType: g }),
  setPeriod: (p) => set({ period: p }),
  setCustomRange: (start, end) => set({ customStart: start, customEnd: end }),
  toggleJob: (j) =>
    set((state) => ({
      selectedJobs: state.selectedJobs.includes(j)
        ? state.selectedJobs.filter((x) => x !== j)
        : [...state.selectedJobs, j],
    })),
  toggleSite: (s) =>
    set((state) => ({
      selectedSites: state.selectedSites.includes(s)
        ? state.selectedSites.filter((x) => x !== s)
        : [...state.selectedSites, s],
    })),
  setSelectedJobs: (jobs) => set({ selectedJobs: jobs }),
  setSelectedSites: (sites) => set({ selectedSites: sites }),
  setSelectedGroupDate: (date) => set({ selectedGroupDate: date }),
  reset: () => set(DEFAULTS),
}));
