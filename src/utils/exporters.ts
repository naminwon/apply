/**
 * 간단한 CSV 변환·다운로드 유틸. 외부 의존성 없음.
 * - 콤마, 따옴표, 줄바꿈 포함 셀은 RFC 4180 방식으로 quote/escape.
 * - Excel 호환을 위해 UTF-8 BOM 선두 삽입.
 */

const BOM = '﻿';

const escapeCell = (raw: unknown): string => {
  if (raw == null) return '';
  const s = String(raw);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const toCsv = <T extends object>(
  rows: readonly T[],
  columns?: (keyof T)[],
): string => {
  if (rows.length === 0) return '';
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const lines = [cols.map(escapeCell).join(',')];
  for (const r of rows) {
    const obj = r as Record<string, unknown>;
    lines.push(cols.map((c) => escapeCell(obj[c])).join(','));
  }
  return lines.join('\n');
};

export const downloadFile = (
  filename: string,
  content: string,
  mime = 'text/csv;charset=utf-8',
) => {
  const blob = new Blob([BOM + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
