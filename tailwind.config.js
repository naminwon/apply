/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        'bg-base': '#FFFFFF',
        'bg-subtle': '#F5F5F5',
        'border-default': '#E5E5E2',
        'text-primary': '#1A1A1A',
        'text-secondary': '#444441',
        'text-tertiary': '#888780',
        // 상태
        'status-active': '#378ADD',
        'status-closed': '#888780',
        'status-success': '#639922',
        'status-warning': '#EF9F27',
        'status-error': '#E24B4A',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans KR"',
          'sans-serif',
        ],
      },
      fontSize: {
        // design-tokens.md 5. 타이포그래피
        h1: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        h2: ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        h3: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
        kpi: ['28px', { lineHeight: '1.2', fontWeight: '500' }],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
};
