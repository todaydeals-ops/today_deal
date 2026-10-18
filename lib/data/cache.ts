// DB 조회 결과를 Next 데이터 캐시에 올린다 — Supabase egress 재발 방지(2026-10-17).
//
// ★왜 페이지가 아니라 여기서 거나
// 2026-09-15 egress 한도 초과로 사이트 전체가 402 로 막혔다. 페이지에 revalidate 를 걸었지만
// 홈·/board·연구소 홈은 searchParams(?corner=·?cat=·?page=)를 읽어서 Next 16 이 revalidate 와
// 무관하게 매 요청 동적 렌더한다(빌드 표에서 ƒ). 크롤러가 한 번 지나갈 때마다 DB 를 다시 읽었다.
// 페이지가 동적이어도 데이터만 캐시에서 나오면 DB 왕복은 revalidate 주기당 1번으로 준다.
//
// ★빈 결과는 캐시하지 않는다
// 조회 함수들은 DB 오류를 [] / 0 / null 로 삼킨다. 그걸 그대로 캐시하면 DB 가 한 번 삐끗한 순간의
// 빈 화면이 10분 동안 박제된다(2026-10-17 magazine-rss.xml 이 항목 0개로 캐시돼 나간 걸 실측했다).
// 그래서 비어 있으면 던져서 캐시를 건너뛰고, 바깥에서 폴백값으로 돌려준다. 원래 비어 있는 조회
// (글 0편인 분류 등)는 캐시가 안 걸릴 뿐 동작은 예전과 같다.
import { unstable_cache } from "next/cache";

class EmptyResult extends Error {}

const isEmpty = (r: unknown) => r == null || r === 0 || (Array.isArray(r) && r.length === 0);

export function cacheNonEmpty<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  key: string,
  revalidate: number,
  fallback: R,
): (...args: A) => Promise<R> {
  const cached = unstable_cache(
    async (...args: A) => {
      const r = await fn(...args);
      if (isEmpty(r)) throw new EmptyResult();
      return r;
    },
    [key],
    { revalidate, tags: [key] },
  );
  return async (...args: A) => {
    try {
      return await cached(...args);
    } catch {
      return fallback;
    }
  };
}
