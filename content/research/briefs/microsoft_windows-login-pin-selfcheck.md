# 윈도우 PIN·비밀번호를 잊어 로그인이 안 될 때 — 조사 전문

- 주제: 윈도우 PIN이나 비밀번호를 잊어 로그인이 안 될 때
- 슬러그: windows-login-pin-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_windows-login-pin-selfcheck.json

## 기존 저장소 대조

- `content/research/facts/` 전체를 Grep 으로 검색했다(PIN, 비밀번호, 로그인, 계정, BitLocker, 복구 키).
- 재사용 가능한 Windows 로그인 팩트는 없었다. microsoft_windows-slow 의 OneDrive 계정 항목과 공통_windows-boot 의 BitLocker 복구 키 caution 은 맥락이 달라 쓰지 않았다.
- 따라서 reused_facts 와 declined_facts 는 빈 배열이다.

## 공식 원문 확인 결과

1. Change or reset your PIN in Windows (en-us)
   - 로그인 화면: PIN 입력란 아래 'I forgot my PIN' 선택. 안 보이면 Sign-in options > Enter your password 로 로그인 후 설정에서 재설정.
   - 설정 경로: Settings > Accounts > Sign-in options > PIN (Windows Hello) > Change PIN, 옛 PIN 을 잊었으면 'I forgot my PIN'.
   - 원문: "This option is only available for Microsoft accounts, not for local accounts."
   - 데이터 삭제 여부, BitLocker 연관 경고는 이 페이지에 없음 (tier 확인실패 항목으로 기록).
2. Windows에서 Microsoft 계정 암호 변경 또는 재설정 (ko-kr)
   - 로그인 화면 '암호를 잊어버렸음', 로그인 옵션 > 웹 로그인 > 암호 잊음, 브라우저 account.live.com/ResetPassword.aspx.
   - 로컬 계정: 비밀번호 입력란 화살표 > 확인 > 암호 재설정 > 보안 질문 답변.
   - 지원 담당자는 재설정 링크를 보내거나 계정을 대신 바꿔 줄 수 없음.
   - 주의: 페이지 요약 과정에서 메뉴 이름이 한국어로 옮겨졌으므로 caution 에 기기별 차이 가능성을 적었다.
3. 로컬 계정에 대한 암호 재설정 디스크 만들기 (ko-kr)
   - 로컬 계정으로 로그인한 상태에서 USB 를 꽂고 제어판 > '암호 재설정 만들기' > '암호 재설정 디스크 만들기'.
   - 비밀번호를 바꿔도 디스크는 새로 만들 필요 없음. 디스크 사용법 자체는 이 페이지에 없음.
4. How to get a Microsoft account recovery code (en-us)
   - 보안 대시보드 'Manage how I sign in' > Recovery code > Generate a new code.
   - 기존 코드는 조회·다운로드 불가, 새 코드를 만들면 이전 코드 무효.
   - 인쇄해 안전하게 보관, 로그인에 쓰는 기기에는 저장하지 말 것.
5. Find your BitLocker recovery key (en-us)
   - 복구 화면의 키 ID 앞 8자리 확인 > 다른 기기에서 aka.ms/myrecoverykey (개인) 또는 aka.ms/aadrecoverykey (직장·학교).
   - 인쇄본, 조직 IT 부서 확인.
   - 원문: "Microsoft Support doesn't have the ability to retrieve, provide, or recreate a lost BitLocker recovery key."
   - 원문: "Resetting your device will remove all of your files."
   - PIN 재설정은 BitLocker 키를 보여주지 않는다는 점을 caution 으로 적었다(출처는 같은 페이지의 구분 설명).
6. Windows Hello 일반적인 문제 및 문제 해결 팁 (en-us)
   - PIN 생성 오류: 로그아웃 후 재로그인하고 다시 생성, 시스템 업데이트 확인.
   - 얼굴·지문 실패: PIN 또는 비밀번호로 로그인 후 Improve recognition 또는 재등록.

## 힌트와 달랐던 점

- 총괄 힌트의 범위 중 "Microsoft 공식 기준 PIN 재설정", "마이크로소프트 계정 비밀번호 재설정", "로컬 계정 한계", "계정 보안 주의"는 공식 문서에서 모두 확인됐다.
- "데이터 보호"는 PIN 재설정 자체에 대해서는 공식 문서에 근거가 없었다. 대신 BitLocker 키 분실 시 기기 초기화가 파일을 전부 지운다는 공식 문구로 데이터 보호 항목을 채웠다.
- 복구 키와 계정 복구 코드는 Microsoft 가 복구해 줄 수 없다는 점이 힌트에 없던 중요 사실이라 팩트에 넣었다.

## 후기 수집 여부

- 공식 문서만으로 충분해서 후기·커뮤니티 방법은 수집하지 않았다.
- 재부팅 후 재시도, 보안 키 로그인 등 시도해 볼 수 있는 방법이 있지만 이번 턴에 원문을 확인하지 못해 팩트로 만들지 않았다. 다음 조사에서 확인이 필요하다.

## 막힌 점

- 로컬 계정의 PIN 재설정 방법은 공식 문서에 명시적 절차가 없었다. 로그인 후 설정에서 재설정하는 경로만 확인됐다.
- 로컬 계정에서 비밀번호도 잊었을 때의 공식 절차(재설정 디스크 사용법, 보안 질문 사용법)는 이번 조사에서 전체 원문을 열지 못했다. 원문 요약에 근거하므로 tier 는 "확실"로 두되 caution 에 확인 필요 사항을 적었다.

## 검색 횟수

- 웹 검색 3회, 페이지 열람 9회 (웹 검색 6회 이내 준수).
