# Vercel / Cloudflare 배포 절차

공식 문서 확인일: 2026-11-05. 프로젝트는 Vite 정적 사이트이며 서버 비밀이나 RunPod 연결을 사용하지 않습니다.

## Vercel

1. 사용할 Vercel 계정과 팀을 확인하고 New Project에서 `Baeksungcil/-temple`을 연결합니다.
2. Framework Vite, Build `npm run build`, Output `dist`, Install `npm ci`, Root `.`. Node 24.x (또는 지원되는 22.12 이상).
3. 실제 GTM ID가 있을 때만 환경 변수 VITE_GTM_ID를 추가합니다. 없다면 비워 둡니다.
4. Deploy 후 vercel.app 주소의 HTTP 200, HTTPS 인증서, WebGL 장면, 모바일 레이아웃, manifest, /sw.js 응답을 확인합니다.
5. Settings → Domains에 사용할 도메인을 추가하고 **해당 화면에 실제 표시되는** A/CNAME/TXT 값을 기록합니다. 과거 예제 IP나 임의 도메인을 사용하지 않습니다.

## Cloudflare DNS와 CDN 선택

공식 Vercel 안내는 직접 연결을 권장합니다. Cloudflare DNS-only는 Cloudflare가 DNS를 관리하고 HTTP/CDN은 Vercel이 처리합니다. **이 경우 Cloudflare HTTP CDN을 사용한다고 표시하면 안 됩니다.**

사용자가 Cloudflare CDN 프록시까지 요구하므로 배포 시 아래 두 구성 중 운영 의도를 확인해야 합니다.

### 권장: DNS-only

Cloudflare의 해당 호스트 레코드에 Vercel에서 받은 값을 입력하고 회색 구름 DNS only. Vercel 인증서/도메인 검증 완료 후 DNS와 HTTPS 확인. 기존 MX/TXT/다른 서비스 레코드는 보존합니다. Cloudflare Nameserver로 바꾸는 작업은 도메인/현재 DNS 확인 후 진행합니다.

### Cloudflare CDN 프록시가 필수일 때

현재 공식 Vercel 문서의 Verified Proxy 지원 조건에 맞추고, 할당된 도메인 Host/SNI 유지 및 Cloudflare SSL/TLS **Full (strict)** 사용. Flexible은 사용하지 않습니다. 인증서 검증 경로를 캐싱·리다이렉트·봇 챌린지로 막지 않아야 합니다. 지원되는 provider header 및 proxy source 조건을 확인합니다. 요금제에 따라 가능한 기능이 다르므로 실제 계정에서 확인합니다.

캐시 규칙 준비안 (실제 zone ID/호스트를 확인한 뒤 적용):
- `GET`, 해당 호스트, `/assets/` 아래 해시 파일에만 CDN 캐시 허용. 원본 Cache-Control 존중.
- `/`, HTML 경로, `/sw.js`, `/manifest.webmanifest`, 인증서 검증 경로는 **Bypass cache**.
- HTML Cache Everything, SW 장기 TTL, Rocket Loader 등 스크립트 실행 순서를 바꾸는 최적화는 사용하지 않음.
- 기존 충돌 규칙과 우선순위를 확인. 다른 도메인까지 일괄 변경하지 않음.
- 새 배포 시 이전 HTML/SW CDN 캐시가 남지 않았는지 확인. PWA 캐시는 앱 자체 업데이트 버튼으로 별도 관리.

Vercel `vercel.json`에서 SW no-store, 일반 응답 재검증, 해시 자산 1년 immutable을 지정했습니다. 로컬 Vite preview는 Vercel 헤더 동작을 재현하지 않으므로 배포 후 실제 응답을 검사해야 합니다.

## 배포 후 검증 명령

실제 도메인으로 바꿔 실행 (API 키 불필요):

```powershell
Resolve-DnsName '<실제 도메인>'
curl.exe -I 'https://<실제 도메인>/'
curl.exe -I 'https://<실제 도메인>/sw.js'
curl.exe -I 'https://<실제 도메인>/manifest.webmanifest'
```

HTTPS 200, 인증서 호스트/유효기간, 리다이렉트 루프 없음, sw no-store, HTML 재검증, 해시 자산 immutable 확인. 프록시 사용 시 CF-Cache-Status와 원본 Vercel 상태를 함께 확인. 도메인·계정 미제공 상태에서 이 검증은 미수행입니다.

## 필요한 정보

- 실제 사원 참고 사진
- Vercel 로그인/연결 및 사용할 팀·프로젝트
- 사용할 도메인, Cloudflare zone 접근과 현재 DNS 보존 대상
- Cloudflare CDN 프록시 필수 여부 (권장 DNS-only와 다름)
- 실제 GTM 컨테이너 ID (없으면 비활성화 유지)
- Gridinsoft LLC+1의 의미

비밀번호/API 토큰은 채팅이나 저장소로 전달하지 말고 각 서비스의 로그인/권한 화면을 사용합니다.

## 공식 근거

- https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment
- https://vercel.com/docs/domains/set-up-custom-domain
- https://developers.cloudflare.com/dns/proxy-status/
- https://developers.cloudflare.com/cache/concepts/cache-responses/
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent
