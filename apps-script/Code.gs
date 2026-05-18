/**
 * 코드넛 채용 지원자 대시보드 — Apps Script Web App
 *
 * 배포:
 *   1. 이 코드를 Apps Script 프로젝트(채용_지원자_데이터_미러 컨테이너 바인딩)에 붙여넣기
 *   2. 「배포 → 새 배포 → 웹 앱」으로 게시
 *      - 다음 사용자로 실행: 본인
 *      - 액세스 권한: 모든 사용자
 *   3. 발급된 URL을 React 측 `.env.local`의 `VITE_API_URL`에 입력
 *
 * 시트 컬럼 (jobs_master) — 헤더가 정확히 다음과 같아야 함:
 *   게시일 | 공고명 | 사이트 | 직무구분 | 공고URL | 상태 | 마감일 | 모집인원 | 광고집행 | 비고
 *
 *   - 마감일/모집인원/광고집행은 비어있어도 OK (null 처리)
 *   - 광고집행은 숫자(원). 미집행이면 빈 셀
 *
 * 시트 컬럼 (applicants_log):
 *   log_id | 지원자수 | 게시일 | 측정일 | 공고명 | 사이트 | 직무구분 | 비고
 *
 * 시트 컬럼 (sync_log):
 *   sync_id | sync_time | status | records_count
 */

const TOKEN = 'codnut-apply-dashboard-1984-1592';

function doGet(e) {
  const params = (e && e.parameter) || {};
  const token = params.token || '';
  const sheet = (params.sheet || 'all').toLowerCase();

  if (token !== TOKEN) {
    return jsonOut({
      success: false,
      error: 'Unauthorized',
      errorCode: 'AUTH_FAILED',
    });
  }

  if (['all', 'jobs', 'applicants', 'joined', 'sync'].indexOf(sheet) < 0) {
    return jsonOut({
      success: false,
      error: 'invalid sheet param',
      errorCode: 'INVALID_PARAM',
    });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {};

    if (sheet === 'all' || sheet === 'jobs' || sheet === 'joined') {
      data.jobs = readRows(ss, 'jobs_master').map(normalizeJob);
    }
    if (sheet === 'all' || sheet === 'applicants' || sheet === 'joined') {
      data.applicants = readRows(ss, 'applicants_log').map(normalizeApplicant);
    }
    if (sheet === 'all' || sheet === 'joined') {
      data.joined = computeJoined(data.applicants, data.jobs);
    }
    if (sheet === 'all' || sheet === 'sync') {
      data.lastSync = readLastSync(ss);
    }

    return jsonOut({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return jsonOut({
      success: false,
      error: String(err),
      errorCode: 'SERVER_ERROR',
    });
  }
}

// ===== helpers =====

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function readRows(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // 모든 셀이 빈 행이면 skip
    let allEmpty = true;
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] != null) {
        allEmpty = false;
        break;
      }
    }
    if (allEmpty) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    rows.push(obj);
  }
  return rows;
}

function fmtDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1);
    const d = String(v.getDate());
    return y + '-' + (m.length < 2 ? '0' + m : m) + '-' + (d.length < 2 ? '0' + d : d);
  }
  if (typeof v === 'string') {
    if (v.length >= 10 && v.charAt(4) === '-' && v.charAt(7) === '-') {
      return v.substring(0, 10);
    }
    const d = new Date(v);
    if (!isNaN(d.getTime())) return fmtDate(d);
  }
  return null;
}

function emptyToNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function toNumberOrNull(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && isFinite(v)) return v;
  const n = Number(String(v).replace(/[,\s]/g, ''));
  return isFinite(n) ? n : null;
}

function fixJobName(v) {
  return v === '벡엔드' ? '백엔드' : v;
}

function normalizeJob(row) {
  return {
    게시일: fmtDate(row['게시일']) || '',
    공고명: String(row['공고명'] || ''),
    사이트: row['사이트'],
    직무구분: fixJobName(row['직무구분']),
    공고URL: String(row['공고URL'] || ''),
    상태: row['상태'],
    마감일: fmtDate(row['마감일']),
    모집인원: toNumberOrNull(row['모집인원']),
    광고집행: toNumberOrNull(row['광고집행']),
    비고: emptyToNull(row['비고']),
  };
}

function normalizeApplicant(row) {
  return {
    log_id: String(row['log_id'] || ''),
    지원자수: Number(row['지원자수']) || 0,
    게시일: fmtDate(row['게시일']) || '',
    측정일: fmtDate(row['측정일']) || '',
    공고명: String(row['공고명'] || ''),
    사이트: row['사이트'],
    직무구분: fixJobName(row['직무구분']),
    비고: emptyToNull(row['비고']),
  };
}

const URL_RE = /\((https?:\/\/[^)]+)\)/;

function extractUrlFromTitle(title) {
  if (!title) return null;
  const m = String(title).match(URL_RE);
  return m ? m[1] : null;
}

function computeJoined(applicants, jobs) {
  const byUrl = {};
  for (let i = 0; i < jobs.length; i++) byUrl[jobs[i]['공고URL']] = jobs[i];
  const out = [];
  for (let i = 0; i < applicants.length; i++) {
    const a = applicants[i];
    const url = extractUrlFromTitle(a['공고명']);
    const j = url ? byUrl[url] || null : null;
    out.push({
      log_id: a.log_id,
      지원자수: a.지원자수,
      게시일: a.게시일,
      측정일: a.측정일,
      공고명: a.공고명,
      사이트: a.사이트,
      직무구분: a.직무구분,
      비고: a.비고,
      공고URL: url,
      상태: j ? j['상태'] : null,
      광고집행: j ? j['광고집행'] : null,
    });
  }
  return out;
}

function readLastSync(ss) {
  const sh = ss.getSheetByName('sync_log');
  if (!sh) return null;
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return null;
  const headers = values[0].map(String);
  // 마지막 비어있지 않은 행
  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    let allEmpty = true;
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] != null) {
        allEmpty = false;
        break;
      }
    }
    if (allEmpty) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
    let syncTime = obj['sync_time'];
    if (syncTime instanceof Date) syncTime = syncTime.toISOString();
    return {
      sync_id: String(obj['sync_id'] || ''),
      sync_time: syncTime ? String(syncTime) : '',
      status: obj['status'] || '',
      records_count: Number(obj['records_count']) || 0,
    };
  }
  return null;
}
