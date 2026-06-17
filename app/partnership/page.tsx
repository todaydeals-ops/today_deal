import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "제휴문의 — 오늘의딜",
  description: "오늘의딜 입점·광고·공동기획 제휴 문의",
};

export default function PartnershipPage() {
  return (
    <LegalLayout title="제휴문의">
      <p>
        오늘의딜은 매일 새로운 타임딜·추천딜을 큐레이션해 이용자에게 소개합니다. 좋은 상품과 브랜드를
        더 많은 분께 알릴 수 있는 제휴를 언제나 환영합니다.
      </p>

      <h2>이런 제휴를 함께해요</h2>
      <ul>
        <li>
          <strong>딜 입점·소개</strong> — 타임딜/추천딜로 노출하고 싶은 상품·프로모션
        </li>
        <li>
          <strong>브랜드 광고·배너</strong> — 메인·카테고리 영역 노출
        </li>
        <li>
          <strong>나눔(경품) 공동기획</strong> — 브랜드 제공 경품으로 함께하는 이벤트
        </li>
        <li>
          <strong>제휴 네트워크·API 연동</strong> — 어필리에이트 링크·상품 피드 연동
        </li>
      </ul>

      <h2>문의 방법</h2>
      <p>
        아래 이메일로 <strong>회사/브랜드명, 담당자, 제휴 종류, 제안 내용</strong>을 보내주시면,
        영업일 기준 2~3일 내에 회신드립니다.
      </p>
      <p>
        <a href="mailto:hello@todaydeals.co.kr?subject=%5B%EC%A0%9C%ED%9C%B4%EB%AC%B8%EC%9D%98%5D%20">
          hello@todaydeals.co.kr
        </a>{" "}
        로 메일 보내기
      </p>

      <h2>운영 정보</h2>
      <p>
        운영: (주)슬로우베리 · 대표 KIM YONG MIN
        <br />
        이메일: <a href="mailto:hello@todaydeals.co.kr">hello@todaydeals.co.kr</a>
      </p>
      <p className="muted">
        ※ 본 메일은 발신 전용 안내가 아닌 문의 접수용입니다. 광고성 스팸·무관한 영업 메일은 회신하지
        않을 수 있습니다.
      </p>
    </LegalLayout>
  );
}
