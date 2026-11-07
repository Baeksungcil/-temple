# Jesus Christ · 3개 실내 공간과 실시간 방문

작업 루트: F:/20261105_Temple. 현재 수정본은 도구의 F: 쓰기 거절 때문에 C:/Users/A/Documents/Codex/TempleWorld_20261106 에서 준비했습니다. F: 반영 전에는 기존 파일을 변경하지 않습니다.

## 구현

- 본당·기도실·교류실: 연결 통로를 통해 직접 걸어서 이동. 방별 좌석과 이동 충돌 공유.
- 약 3등신 자체 카툰 방문객: 큰 머리, 짧은 팔다리, 걷기·앉기·기도. 특정 마리오 모델/이미지를 사용하지 않았습니다.
- 무광 PBR 대리석·목재 재질, 직접 제작한 실제 RGBE HDRI 조명. 반사는 낮췄습니다. 공간은 절차형 3D 모델이며 사진급 실사 스캔/실측 복제본은 아닙니다.
- 실시간 서버 한 프로세스에 최대 100명. 같은 방의 다른 방문객을 GPU instancing으로 표시. 서버가 좌석 소유와 이동 범위·속도를 검사합니다.
- 표시 이름과 전체 대화창. 메시지 200자·10초 3회 제한. HTML을 실행하지 않고 텍스트로 표시. 대화는 접속자에게만 전송하고 디스크에 보관하지 않습니다.
- 기존 한국시간 조명·PWA·모바일 조작·GTM 동의 기능 유지. 실제 GTM ID 없음 → 비활성화.

## 실행 (PowerShell 터미널 두 개)

Node 24.15.0에서 검증했습니다. venv는 사용하지 않습니다.

첫 번째 터미널:

    Set-Location F:\20261105_Temple
    npm ci --cache .npm-cache
    npm run server:install
    npm run world

두 번째 터미널:

    Set-Location F:\20261105_Temple
    npm run build
    npm run preview:world

http://127.0.0.1:5182 접속. 개발은 npm run dev (5173). 현재 임시 수정본 미리보기 역시 5182에서 실행 중입니다.

서버 의존성 ws 8.22.1은 공식 릴리스 소스를 Git blob SHA와 대조해 server/vendor/ws에 포함했습니다. 라이선스와 출처를 보존했으며 npm run server:install은 네트워크 없이 설치할 수 있습니다. 일반 npm 명령이 인식되지 않으면 C:\Program Files\nodejs\npm.cmd를 사용합니다.

## 조작

WASD/방향키 이동, E 또는 버튼으로 의자 앉기·일어서기, P 또는 버튼으로 기도. 휴대폰 방향 버튼·동작 버튼 동일. 드래그로 시점 회전, 휠/두 손가락으로 확대. 채팅 입력 중에는 이동 키를 처리하지 않습니다. 앉기 전환·기도 중에는 이동이 잠깁니다.

## 검증

    npm test
    npm run test:server
    npm run test:load

server/load-result.json: 실제 Node WebSocket 클라이언트 100개의 12초 이동·채팅 부하 결과. 101번째 연결 차단, 전체 채팅 수신 확인. 이 시험은 100대 브라우저의 GPU/모바일 성능이나 실제 인터넷 배포 성능을 보장하지 않습니다. RSS는 시험 서버와 클라이언트가 같은 프로세스에 있어 합산 값입니다.

tools/verify-world.mjs는 독립 브라우저의 방문객 표시·안전한 채팅·3개 방 이동·모바일 HDRI 렌더를 검사합니다. 최종 결과는 browser-result.json에 저장합니다.

## HDRI 출처

public/lighting/temple-studio.hdr는 tools/generate-hdri.mjs로 제작한 1024×512 RGBE 고명암 스튜디오 조명입니다. 외부 사진 HDRI 다운로드는 도구 네트워크 오류로 실패했습니다. 자체 제작 맵을 Poly Haven 사진으로 표시하지 않습니다. HDRLoader 파싱·1.0 초과 광량을 실제 검사합니다. 실패하면 기본 실내 조명으로 전환하고 UI에 실패를 표시합니다. 오프라인 저장에도 HDRI를 포함합니다.

## 인터넷 배포

프런트엔드는 Vercel, 100명이 같은 상태를 공유하는 서버는 지속 실행 Node 프로세스로 준비했습니다. 서버의 HOST/PORT/ALLOWED_ORIGINS와 프런트의 VITE_WORLD_WS_URL을 실제 주소로 설정합니다. HTTPS 페이지에는 wss:// 주소가 필요합니다. VITE 환경 변수에는 비밀 값을 넣지 않습니다.

현재 Vercel Functions도 WebSocket을 지원하지만 연결은 함수 최대 실행시간에 묶이고, 이후 연결이 동일 인스턴스로 간다는 보장이 없습니다. 이 구현은 한 서버 메모리에 정원·좌석 상태를 공유하므로 전용 단일 프로세스를 사용합니다. Cloudflare DNS-only 선택은 유지합니다. 새 유료 자원·GitHub push·배포는 수행하지 않았습니다.

server/Dockerfile은 저장소 루트에서 docker build -f server/Dockerfile . 로 사용할 수 있는 준비안입니다. Docker 자체는 설치/실행하지 않았습니다. 운영 배포 전 실제 호스트에서 장시간 100명 부하·인터넷 지연·브라우저 성능 검증이 필요합니다. 게스트 이름은 본인 인증이 아니며, 공개 운영의 신고·관리자 제재·운영 정책은 추가 범위입니다.

공식 근거: https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections , https://github.com/websockets/ws/releases/tag/8.22.1 , https://threejs.org/docs/pages/HDRLoader.html
