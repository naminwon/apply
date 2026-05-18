import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import type { JobMaster, JoinedRecord, SyncInfo } from '../../api/types';
import { ExportMenu } from './ExportMenu';

interface HeaderProps {
  dataRange: { start: string; end: string } | null;
  lastSync: SyncInfo | null;
  jobs: JobMaster[];
  joined: JoinedRecord[];
}

export function Header({ dataRange, lastSync, jobs, joined }: HeaderProps) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const isOk = lastSync?.status === 'SUCCESS';
  const relativeSync = lastSync
    ? formatDistanceToNow(parseISO(lastSync.sync_time), {
        addSuffix: true,
        locale: ko,
      })
    : '동기화 정보 없음';

  return (
    <header className="bg-primary px-6 py-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">코드넛 채용 지원자 대시보드</h1>
        <div className="flex items-center gap-2">
          {dataRange && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-body">
              <Calendar size={14} />
              <span>
                {dataRange.start} ~ {dataRange.end}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            title="데이터 새로고침"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body transition-colors ${
              isOk
                ? 'bg-status-success/25 hover:bg-status-success/40'
                : 'bg-status-error/25 hover:bg-status-error/40'
            }`}
          >
            {isOk ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{relativeSync}</span>
            <RefreshCw size={14} />
          </button>
          <ExportMenu jobs={jobs} joined={joined} />
        </div>
      </div>
    </header>
  );
}
