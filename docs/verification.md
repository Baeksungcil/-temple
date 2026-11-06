# 로컬 검증 기록 · 2026-11-05

- 최초 로컬 폴더/원격 저장소: 비어 있음. 기존 파일 덮어쓰기 없음.
- npm 설치: 전용 `.npm-cache` 사용. 기본 AppData 캐시는 쓰기 거절되어 사용하지 않음.
- Node 24.15.0 / npm 11.12.1 / Three.js 0.187.0 / Vite 8.3.6.
- 프로덕션 빌드 성공. JS 약 579KB, gzip 약 145KB. 번들 500KB 경고는 남아 있음.
- 단위 테스트 4개 통과: 한국시간, 조명 범위, GTM ID 입력, 차단된 저장소.
- 브라우저 검증: Windows Chrome + 소프트웨어 WebGL. 데스크톱/모바일 스크린샷 직접 확인.
- 오프라인 초기 문제: Vite preview `Vary: Origin` 헤더로 precache 자산 매칭 실패. 동일 출처·지정 자산 캐시의 ignoreVary로 수정. 오프라인 재열기 성공.
- 실제 휴대폰 GPU, 사용자 기기 PWA 설치, 실 GTM 컨테이너는 미검증.
- 브라우저 UI 연결 도구가 `The browser access host is unavailable`을 반환. 사용자 화면에 자동으로 열렸다고 보고하지 않음. 직접 http://127.0.0.1:5173 열기 가능.
- 참고 사진 미수령으로 사원은 임시 디자인.
- Vercel 계정/대상 도메인/Cloudflare zone 미제공. 실제 배포, DNS 변경, 공개 HTTPS 검사는 미수행.
- 비밀 값과 Gridinsoft 의존성 없음. KizKAT / RunPod 변경 없음.
