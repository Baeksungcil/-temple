# Temple · 고요한 마당

작업 루트: `F:\20261105_Temple`  
저장소: https://github.com/Baeksungcil/-temple

2026-11-05 최초 점검 당시 로컬 폴더는 숨김 파일을 포함해 비어 있었고 `.git`이 없었습니다. GitHub 저장소도 비어 있었습니다. 기존 KizKAT 프로젝트는 변경하지 않았습니다.

## 실행

Node.js 22.12 이상 권장. 개발에 사용한 환경: Windows, Node 24.15.0, npm 11.12.1.

```powershell
Set-Location 'F:\20261105_Temple'
# 가상환경(venv)은 필요 없습니다.
& 'C:\Program Files\nodejs\npm.cmd' ci --cache .npm-cache
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

http://127.0.0.1:5173 에 접속합니다. 일반 PATH가 정상인 PC는 `npm`만 입력해도 됩니다.

```powershell
npm test
npm run build
npm run preview
npm run test:browser
```

브라우저 검증은 현재 Windows Chrome 경로를 사용합니다. 다른 OS는 `playwright.config.js`의 executablePath를 변경하거나 Playwright Chromium을 설치한 환경에서 실행하세요. 로컬 검증용 소프트웨어 WebGL 렌더링은 실제 휴대폰 GPU 성능 검증을 대신하지 않습니다.

## 장면과 조작

Three.js MeshToonMaterial로 만든 한국 사원·마당·나무·등불입니다. 외부 모델이나 텍스처를 내려받지 않습니다. **참고 사진 미수령 상태의 임시 사원**이며 실물 재현 완료가 아닙니다. 사진을 받은 뒤 `src/main.js`의 장면 구성 부분을 변경합니다.

- PC: 드래그 회전, 휠 확대, 우클릭 이동. 캔버스를 클릭한 뒤 WASD/방향키로 평면 이동.
- 모바일: 한 손가락 회전, 두 손가락 확대·이동, 화면 방향 버튼으로 평면 이동.
- 처음 시점 버튼으로 카메라 복귀. 카메라 이동 범위 제한.
- Asia/Seoul 기준 시간에 맞춰 광량·배경색·등불 변화. 낮/노을/밤 수동 확인 가능.
- 조명은 06~18시를 기준으로 한 시각 연출이며 실제 일출·일몰 천문 계산은 아닙니다.
- 최대 pixel ratio 1.75, 렌더링 약 30fps 상한, 숨긴 탭 렌더링 중지.
- WebGL 2 미지원/컨텍스트 손실 시 오류 안내. 초기화 완료 전 로딩 안내.

## PWA / 오프라인

manifest, 192/512 PNG와 SVG 아이콘을 포함합니다. HTTPS 또는 localhost에서 동작합니다. Chromium의 설치 조건을 만족하면 설치 버튼이 나타납니다. iOS는 Safari 공유 → 홈 화면에 추가를 사용합니다.

프로덕션 빌드만 SW를 등록합니다. `npm run preview`로 최초 접속한 뒤 새로고침하고 오프라인 재열기를 확인하세요. 개발 서버는 SW를 등록하지 않습니다.

- HTML: network-first, 실패하면 저장된 루트 화면 → 기본 오프라인 화면.
- 해시 자산: cache-first. 동일 출처의 지정 자산 GET만 처리. GTM 요청을 저장하지 않음.
- 빌드 콘텐츠 해시로 캐시 버전 변경. 새 버전은 사용자 업데이트 버튼으로 적용.
- 기존 탭의 옛 자산을 깨뜨리지 않기 위해 이전 캐시를 즉시 삭제하지 않습니다. 장기 사용 시 브라우저 사이트 데이터 관리에서 정리할 수 있습니다.
- 오프라인 첫 방문은 보장하지 않습니다. 설치/프리캐시가 성공한 뒤 사용 가능합니다.

## Google Tag Manager

`.env.example`을 `.env.local`로 복사하고 **실제 제공받은** `VITE_GTM_ID`를 입력합니다. 빈 값이면 분석 태그는 비활성화됩니다. GTM ID는 공개 식별자이며 API 키 같은 비밀을 VITE 변수에 넣으면 안 됩니다. 빌드 환경 변수를 바꾸면 다시 빌드해야 합니다.

Basic consent 방식: analytics/ad 저장 기본 denied, 사용자가 분석 허용을 누른 뒤에만 GTM 스크립트를 로드합니다. 광고 관련 세 항목은 계속 denied입니다. 거절 시 Google 요청을 보내지 않습니다. 분석 설정에서 철회하면 denied 갱신 후 페이지를 재시작해 컨테이너 실행을 중단합니다. 이미 전송된 데이터는 취소되지 않으며 제3자 저장소의 일괄 삭제를 보장하지 않습니다. 실제 컨테이너의 각 태그에도 동의 검사를 설정하고 운영 개인정보 안내/CMP 요구사항을 별도로 점검해야 합니다. 현재 실제 ID 미제공으로 실계정 태그 수집은 미검증입니다.

## 배포

[배포 및 Cloudflare 설정](docs/deployment.md)을 참조하세요. Vercel 설정 파일은 준비되어 있지만 계정/프로젝트/도메인이 제공되기 전에는 실제 배포·DNS·HTTPS 성공으로 보고하지 않습니다.

`Gridinsoft LLC+1`은 용도가 확인되지 않아 의존성·서비스로 추가하지 않았습니다.
