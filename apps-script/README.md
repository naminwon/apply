# Apps Script Web App

`채용_지원자_데이터_미러` 스프레드시트에 바인딩된 Apps Script 코드입니다.

## 배포 순서

1. **Apps Script 에디터 열기**
   - 시트에서 `확장 프로그램 → Apps Script`
2. **기존 `doGet`을 `Code.gs` 내용으로 교체**
3. **저장** (디스크 아이콘)
4. **배포**
   - 「배포 → 새 배포」
   - 유형 선택: **웹 앱**
   - 다음 사용자로 실행: **본인**
   - 액세스 권한: **모든 사용자**
   - 「배포」 클릭 후 권한 승인
5. **새 deployment URL이 발급되면** React의 `.env.local`의 `VITE_API_URL`을 교체하고 dev 서버 재시작
   - 같은 deployment ID를 유지하고 싶다면 「배포 관리 → ✏️ 편집 → 새 버전 → 배포」

## 시트 컬럼 추가 (Phase 2 활성화)

대시보드의 경쟁률·목표달성률·공고 진행률·광고 ROI 기능을 켜려면 `jobs_master` 시트에 컬럼을 추가하세요.

### jobs_master 헤더 (전체)

```
게시일 | 공고명 | 사이트 | 직무구분 | 공고URL | 상태 | 마감일 | 모집인원 | 광고집행 | 비고
```

| 컬럼 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 마감일 | Date | N | 빈 셀 가능 → 진행률 미산정 |
| 모집인원 | Integer | N | 빈 셀 가능 → 경쟁률·목표달성률 미산정 |
| 광고집행 | Integer | N | 광고비(원). 빈 셀 = 미집행. 광고 ROI 분석에 사용 |

### applicants_log, sync_log

기존 그대로 유지 (변경 없음).

## 응답 스키마

코드는 다음 형태로 반환합니다:

```jsonc
{
  "success": true,
  "data": {
    "jobs":       [/* 정규화된 JobMaster[] */],
    "applicants": [/* 정규화된 ApplicantLog[] */],
    "joined":     [/* 서버 측 JOIN 결과 */],
    "lastSync":   { "sync_id": "...", "sync_time": "...", "status": "...", "records_count": 0 }
  },
  "timestamp": "ISO-8601"
}
```

서버 측 정규화 보장:
- 날짜는 `yyyy-MM-dd` 문자열
- 빈 셀은 `null`
- 광고집행은 `number | null` (원)
- `벡엔드` → `백엔드` (오타 정규화)
- `joined`는 공고명에서 URL 추출 → jobs JOIN

## 보안

`TOKEN` 상수가 코드 상단에 있습니다. React `.env.local`의 `VITE_API_TOKEN`과 동일해야 합니다.
