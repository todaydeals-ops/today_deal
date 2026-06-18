// 관리자 간단 비번 게이트 — 미들웨어(Edge)와 라우트(Node)가 공유하는 순수 상수.
// (실제 보안 강화 시 Vercel 환경변수 ADMIN_USER/ADMIN_PASS 설정)
export const ADMIN_COOKIE = "td_admin";
// 비번 검증 통과 시 발급되는 세션 마커. 실제 게이트는 비밀번호.
export const ADMIN_TOKEN = "td-admin-ok-7Qp2x9Lm4Vn8Rs3Wd6Yk1Bf5Hc0Jt";
export const ADMIN_MAXAGE = 60 * 60 * 24 * 7; // 7일
