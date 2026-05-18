import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import type { JobMaster, JoinedRecord } from '../../api/types';
import { downloadFile, toCsv } from '../../utils/exporters';

interface ExportMenuProps {
  jobs: JobMaster[];
  joined: JoinedRecord[];
}

export function ExportMenu({ jobs, joined }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const exportJobs = () => {
    const csv = toCsv(jobs);
    downloadFile(`jobs_${ymd()}.csv`, csv);
    setOpen(false);
  };

  const exportApplicants = () => {
    const csv = toCsv(joined);
    downloadFile(`applicants_${ymd()}.csv`, csv);
    setOpen(false);
  };

  const exportPdf = () => {
    // 브라우저 print 다이얼로그로 PDF 저장 유도. print stylesheet는 index.css 참조.
    setOpen(false);
    window.print();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-body text-white transition-colors hover:bg-white/20"
      >
        <Download size={14} />
        내보내기
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-md border border-border-default bg-bg-base shadow-md">
          <MenuItem
            icon={<FileSpreadsheet size={14} />}
            label="공고 CSV"
            hint={`${jobs.length}건`}
            onClick={exportJobs}
          />
          <MenuItem
            icon={<FileSpreadsheet size={14} />}
            label="측정 로그 CSV"
            hint={`${joined.length}건`}
            onClick={exportApplicants}
          />
          <div className="border-t border-border-default" />
          <MenuItem
            icon={<Printer size={14} />}
            label="대시보드 PDF"
            hint="브라우저 인쇄"
            onClick={exportPdf}
          />
          <MenuItem
            icon={<FileText size={14} />}
            label="현재 화면 인쇄"
            onClick={() => {
              setOpen(false);
              window.print();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-body text-text-primary transition-colors hover:bg-bg-subtle"
    >
      <span className="inline-flex items-center gap-2 text-text-secondary">
        {icon}
        {label}
      </span>
      {hint && <span className="text-caption text-text-tertiary">{hint}</span>}
    </button>
  );
}

const ymd = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};
