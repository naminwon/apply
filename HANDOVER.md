# 인수인계 문서 — 코드넛 채용 지원자 대시보드

후임자가 이 문서 하나로 운영을 이어받을 수 있도록 작성했습니다. 의존 관계가 있는 외부 시스템(Google Sheets, Apps Script, GitHub Pages, DNS)이 여러 곳에 흩어져 있으니 **2. 시스템 구성** 그림을 먼저 보고 시작하세요.

- **운영 도메인**: https://apply.mwna.me
- **목적**: 사람인·잡코리아·로켓펀치·그룹바이 4개 사이트의 공고별 지원자 추이 시각화
- **데이터 입력 주기**: 주 2회 (월/목 권장)

데이터 입력 절차는 별도 문서 **[`DATA_UPLOAD.md`](./DATA_UPLOAD.md)** 참고.

---

## 1. 핵심 정보 요약

| 항목 | 값 |
|---|---|
| 운영 URL | https://apply.mwna.me |
| GitHub 저장소 | https://github.com/naminwon/apply |
| 호스팅 | GitHub Pages (저장소 내장) |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) |
| 빌드 산출물 | `dist/` (Vite 빌드) |
| 데이터 출처 | Google Sheets `채용_지원자_데이터_미러` |
| 백엔드 | Google Apps Script Web App (시트에 컨테이너 바인딩) |
| Apps Script Web App URL | `https://script.google.com/macros/s/AKfycbxZdulmRtdFwxcEWX0URRnyHnucjrnOv8i9LwarsTtv4omk7Tgqpquw4S8nXximHIGljw/exec` |
| API 토큰 | `codnut-apply-dashboard-1984-1592` (약한 토큰. 클라이언트 번들에 포함됨) |
| 도메인 DNS 관리 | 한국 레지스트라 (가비아/후이즈/카페24 등) |
| 관리자 이메일 | mwna@codnut.com |

---

## 2. 시스템 구성

```
[Google Sheets]                 ← 사람이 행을 직접 입력
 채용_지원자_데이터_미러
   ├─ jobs_master
   ├─ applicants_log
   └─ sync_log
        │
        ▼ (컨테이너 바인딩)
[Apps Script Web App]            ← doGet()이 시트를 읽어 JSON 반환
 .../exec?token=...&sheet=all
        │
        ▼ (브라우저가 직접 fetch)
[React SPA — apply.mwna.me]      ← GitHub Pages가 정적 dist/ 서빙
  React 18 + Vite + TanStack Query
        │
        ▼
[사용자 브라우저]                 ← 5분 React Query 캐시
```

**핵심 포인트**: 호스팅(Pages)은 시트와 통신하지 않습니다. 사용자의 **브라우저가 직접** Apps Script URL을 호출해 데이터를 받아옵니다. 그래서:

- 데이터만 바꿔도 됨 → 재배포 불필요
- 호스팅을 옮겨도 됨 → Apps Script와 무관
- 단, `VITE_API_URL`/`VITE_API_TOKEN`은 **빌드 시점에 JS 번들에 박힘** → 이 값이 바뀌면 재배포 필요

---

## 3. 저장소 구조와 기술 스택

### 3.1 디렉토리

```
dashboard-bundle/
├─ src/                       # React 앱
│  ├─ api/                    # Apps Script API 클라이언트, 타입
│  ├─ components/             # 차트·필터 컴포넌트
│  ├─ stores/filterStore.ts   # Zustand 필터 상태
│  └─ ...
├─ apps-script/Code.gs        # Google Apps Script 백엔드 코드 (마스터)
├─ public/CNAME               # GitHub Pages 커스텀 도메인 바인딩
├─ .github/workflows/deploy.yml  # GitHub Actions 배포 워크플로
├─ specs/                     # 화면·데이터·디자인 토큰 명세
├─ mock-data/api-response.json  # 개발용 더미 데이터
├─ DATA_UPLOAD.md             # 데이터 입력 매뉴얼
├─ HANDOVER.md                # (이 문서)
└─ CLAUDE.md                  # AI 어시스턴트용 컨텍스트
```

### 3.2 기술 스택

| 영역 | 라이브러리 |
|---|---|
| 프레임워크 | React 18 + Vite + TypeScript |
| 차트 | Recharts |
| 상태 관리 | Zustand |
| 데이터 페칭 | TanStack Query (5분 캐싱) |
| 스타일 | Tailwind CSS |
| 날짜 처리 | date-fns |

### 3.3 시트 ↔ 코드 enum 정합성

다음 두 곳의 값이 시트의 실제 값과 정확히 일치해야 합니다:
- `src/api/types.ts` — `Site`, `Job` 타입
- `src/constants/colors.ts` — `SITE_COLORS`, `JOB_COLORS` 키

새 사이트나 직무 분류를 시트에 추가하려면 이 두 파일을 함께 수정 후 재배포해야 합니다. (자세한 절차는 `specs/design-tokens.md` 참고)

---

## 4. 환경변수 (가장 자주 실수하는 부분)

Vite는 `VITE_*` 환경변수를 **빌드 시점**에 JS 번들에 인라인합니다. 즉:
- 로컬 개발(`npm run dev`)에선 `.env.local` 사용
- 프로덕션 빌드(GitHub Actions)에선 **저장소 Secrets/Variables** 가 진실의 원천

### 4.1 로컬 (`.env.local`)

```bash
VITE_API_URL=https://script.google.com/macros/s/AKfycbxZdulmRtdFwxcEWX0URRnyHnucjrnOv8i9LwarsTtv4omk7Tgqpquw4S8nXximHIGljw/exec
VITE_API_TOKEN=codnut-apply-dashboard-1984-1592
VITE_USE_MOCK=false   # true로 두면 mock-data/api-response.json을 사용
```

### 4.2 GitHub Actions

저장소 → **Settings → Secrets and variables → Actions**

| 종류 | 이름 | 값 | 비고 |
|---|---|---|---|
| Secret | `VITE_API_URL` | Apps Script Web App URL | 4.1과 동일 |
| Secret | `VITE_API_TOKEN` | API 토큰 | 4.1과 동일 |
| **Variable** | `VITE_USE_MOCK` | `false` | **Secret이 아닌 Variable 탭**. 미설정 시 워크플로 기본값 `'true'`로 빌드되어 Mock 데이터가 노출됩니다 |

> `.github/workflows/deploy.yml:34` 에서 `vars.VITE_USE_MOCK || 'true'` 로 fallback이 되어 있어, **Variables를 안 만들면 Mock 데이터로 배포됩니다.** 가장 흔한 함정.

---

## 5. 배포 절차

### 5.1 코드 변경 후 자동 배포

```
git push origin main
```

→ `.github/workflows/deploy.yml`이 자동 트리거되어 `npm ci` → `npm run build` → GitHub Pages에 업로드. 1~2분 소요. 진행 상황은 저장소 **Actions** 탭에서 확인.

### 5.2 코드 변경 없이 강제 재배포

저장소 → **Actions** → 좌측 "Deploy to GitHub Pages" → **Run workflow** 버튼 → `main` 선택 → 실행.

다음 상황에서 필요:
- 환경변수(Secrets/Variables)를 바꿨을 때
- Apps Script Web App URL을 새로 발급받았을 때 (5.5 참조)

### 5.3 Pages 활성화 확인

저장소 → **Settings → Pages**
- Source: **GitHub Actions** (브랜치 방식 X)
- Custom domain: 비워둬도 됨 (`public/CNAME` 파일이 알아서 등록)
- **Enforce HTTPS**: 체크 (DNS 전파 완료 후 자동 발급된 SSL이 활성화되면 체크 가능)

### 5.4 DNS 설정 (도메인 변경 시)

레지스트라(가비아/후이즈/카페24 등) DNS 관리 콘솔에 CNAME 레코드:

| 종류 | 호스트 | 값 |
|---|---|---|
| CNAME | `apply` | `naminwon.github.io.` |

전파에 5~30분 소요. `dig apply.mwna.me` 또는 `nslookup apply.mwna.me` 로 확인.

> 도메인 자체(`mwna.me`)는 다른 용도로 사용 중일 수 있으니 건드리지 않습니다. 서브도메인(`apply.`)만 추가.

### 5.5 Apps Script 재배포 (백엔드 코드 변경 시)

`apps-script/Code.gs`를 수정한 경우:

1. Google Drive에서 스프레드시트 `채용_지원자_데이터_미러` 열기
2. **확장 프로그램 → Apps Script** 클릭
3. 에디터에 표시되는 코드를 저장소의 최신 `apps-script/Code.gs` 내용으로 교체
4. 💾 저장 후 우측 상단 **배포 → 배포 관리**
5. 기존 배포의 ✏️ 편집 → **버전: 새 버전** → 배포 (URL 유지됨)
6. URL이 바뀌었다면(드물지만 새 배포로 만든 경우) `VITE_API_URL` Secret 업데이트 후 5.2의 강제 재배포 실행

⚠️ 배포 설정은 반드시 **"다음 사용자로 실행: 본인", "액세스 권한: 모든 사용자"** — 이 설정이 아니면 React 앱이 CORS/권한 오류로 데이터를 못 받습니다.

---

## 6. 일상 운영 체크리스트

### 6.1 매주 (정기 측정 회차 직후)

- [ ] `applicants_log` 시트에 이번 회차 측정 행이 모두 들어갔는지 (`DATA_UPLOAD.md` 3절 참조)
- [ ] 대시보드 https://apply.mwna.me 접속해 그래프에 새 측정일이 추가됐는지 확인
- [ ] **활성 공고 수(B 영역)** 수가 예상과 같은지 — 다르면 `jobs_master` 의 `상태` 컬럼 점검

### 6.2 공고가 새로 게시되었을 때

- [ ] `jobs_master`에 한 행 추가 (`DATA_UPLOAD.md` 2절 참조)
- [ ] 첫 측정 회차에 `applicants_log`에도 행 추가

### 6.3 공고가 마감되었을 때

- [ ] `jobs_master.상태` 를 `마감`으로 변경
- [ ] (선택) `마감일` 입력
- [ ] 이후 `applicants_log`에 새 행 추가 중단

### 6.4 월 1회

- [ ] GitHub Actions의 최근 빌드가 모두 초록색인지 확인
- [ ] `npm outdated` 로 의존성 업데이트 후보 점검 (선택)

---

## 7. 트러블슈팅

### 7.1 사이트가 열리지 않음 / 404

| 원인 | 점검 |
|---|---|
| DNS 전파 실패 | `dig apply.mwna.me` 결과가 `naminwon.github.io.`로 나오는지 |
| GitHub Pages 비활성 | Settings → Pages 에서 Source가 "GitHub Actions"인지 |
| CNAME 파일 누락 | `public/CNAME` 파일이 있고 내용이 정확히 `apply.mwna.me`인지 |
| HTTPS 인증서 미발급 | DNS 전파 완료 후 30분 대기 → "Enforce HTTPS" 다시 체크 |

### 7.2 화면은 뜨는데 데이터가 비어 있음 / Mock으로 표시됨

| 원인 | 점검 |
|---|---|
| **`VITE_USE_MOCK` Variable 미설정** (가장 흔함) | 4.2 표 참고. 등록 후 5.2로 재배포 |
| Apps Script URL 변경됨 | 새 URL로 `VITE_API_URL` Secret 갱신 → 재배포 |
| Apps Script 배포 권한 오류 | 5.5 참고. "액세스: 모든 사용자" 재확인 |
| 토큰 불일치 | `apps-script/Code.gs:24` 의 `TOKEN` 상수와 `VITE_API_TOKEN` Secret이 같은 값인지 |

### 7.3 특정 공고/직무만 안 보임

| 원인 | 점검 |
|---|---|
| `사이트`/`직무구분` 오타 | 시트 셀이 정확한 enum 값인지 (`DATA_UPLOAD.md` 2.3) |
| `applicants_log.공고명`에 URL 누락 | `(https://...)` 형식이 들어가 있는지 |
| `공고URL` 불일치 | `jobs_master.공고URL`과 `applicants_log.공고명` 안의 URL이 정확히 같은지 |

### 7.4 GitHub Actions 빌드 실패

Actions 탭의 실패한 워크플로 로그 확인:
- `npm ci` 실패 → `package-lock.json`이 최신인지, Node 버전(20) 일치하는지
- `tsc -b` 실패 → 로컬에서 `npm run typecheck`로 동일 오류 재현 후 수정
- `actions/deploy-pages` 실패 → Settings → Pages 가 "GitHub Actions" 소스로 설정되어 있는지

### 7.5 데이터 입력 후 반영이 늦음

React Query 캐시 5분. **Cmd+Shift+R** 강제 새로고침으로 즉시 갱신.

---

## 8. 알려진 제약과 향후 개선 여지

### 8.1 약한 토큰 노출

`VITE_API_TOKEN`은 클라이언트 JS 번들에 평문으로 포함됩니다. Apps Script API의 인증은 사실상 "직접 URL을 알지 못하는 자동 봇 차단" 수준입니다. 민감 데이터로 다루지 마세요.

강화 방법(필요 시):
- Apps Script에 IP 화이트리스트 추가 (서버리스 한계로 제한적)
- 인증을 OAuth/세션 기반으로 옮기려면 별도 백엔드 추가 필요 (현 구조 폐기)

### 8.2 Apps Script Web App URL 변경 리스크

새 배포로 발급되면 URL이 바뀝니다. **반드시 "기존 배포 편집 → 새 버전"** 으로 진행해 URL을 유지하세요. 부득이하게 URL이 바뀌면 4.2의 `VITE_API_URL` 갱신 + 재배포 필요.

### 8.3 Phase 2 미완 항목

`specs/data-schema.md`에 적힌 `마감일`·`모집인원`·`광고집행`은 데이터 컬럼은 존재하지만 대시보드 위젯이 일부만 활용 중입니다. 경쟁률·목표달성률·광고 ROI 그래프는 차후 구현 여지가 있습니다.

### 8.4 GitHub Pages의 SPA 라우팅 제약

현재 단일 페이지라 문제 없지만, 차후 `react-router`로 다중 경로를 추가할 경우 `404.html → index.html` 우회 처리가 필요합니다.

---

## 9. 관련 문서

- **데이터 입력 매뉴얼**: [`DATA_UPLOAD.md`](./DATA_UPLOAD.md)
- **데이터 스키마·API 명세**: [`specs/data-schema.md`](./specs/data-schema.md)
- **화면 설계서**: [`specs/dashboard-spec.md`](./specs/dashboard-spec.md)
- **컬러·디자인 토큰**: [`specs/design-tokens.md`](./specs/design-tokens.md)
- **컴포넌트 명세**: [`specs/component-spec.md`](./specs/component-spec.md)
- **Apps Script 코드 마스터**: [`apps-script/Code.gs`](./apps-script/Code.gs)
- **Apps Script 배포 가이드**: [`apps-script/README.md`](./apps-script/README.md)

---

## 10. 인수인계 시 확인할 체크리스트

후임자에게 권한을 넘길 때:

- [ ] Google Drive `채용_지원자_데이터_미러` 스프레드시트 편집자 권한
- [ ] Apps Script 프로젝트 편집자 권한 (스프레드시트 → 확장 프로그램 → Apps Script)
- [ ] GitHub 저장소 `naminwon/apply` 권한 (직접 push가 필요하면 Write, 운영만이면 Read+Actions 권한)
- [ ] DNS 관리 콘솔(레지스트라) 접근 권한 (도메인 변경이 필요할 때만)
- [ ] 이 문서(`HANDOVER.md`)와 `DATA_UPLOAD.md` 위치 안내
- [ ] 최근 측정 회차 1회를 함께 진행해 보며 절차 시연
