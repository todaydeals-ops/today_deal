import { inlineHtml } from "./inline";

/** 원고 한 줄(굵게만 허용)을 <span> 안에 그린다. 훅이 없어 서버·클라이언트 어디서든 쓴다. */
export default function H({ s }: { s: string }) {
  return <span dangerouslySetInnerHTML={{ __html: inlineHtml(s) }} />;
}
