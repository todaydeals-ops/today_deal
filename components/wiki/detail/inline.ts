// 생활백과 원고 한 줄 → 안전한 HTML. 원고는 일반 텍스트이고 **굵게** 만 허용한다(나머지는 전부 이스케이프).
// 서버(WikiDetailView)와 클라이언트(PrepChecklist)가 같은 함수를 쓴다.
export function inlineHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
