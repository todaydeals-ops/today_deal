-- 오늘의딜 — 데모 시드 데이터
-- schema.sql 실행 후, SQL Editor 에서 실행하면 프론트가 실DB 데이터로 렌더됩니다.
-- 마감/시작 시각은 now() 기준 상대값으로 넣어 카운트다운/상태가 살아있게 함.

-- 타임딜 ────────────────────────────────
insert into public.deals (platform, product_name, product_url, discount_rate, sale_price, deal_end_at, is_soldout, display_order) values
  ('gmarket','퐁퐁 친환경 주방세제 오렌지 980ml + 리필 1.2L 3개','https://www.gmarket.co.kr/n/superdeal',45,9900, now() + interval '8 hour', false, 1),
  ('gmarket','스파크 찬물세척 실내건조 세탁세제 9Kg 1+1','https://www.gmarket.co.kr/n/superdeal',39,20900, now() + interval '8 hour', false, 2),
  ('gmarket','아웃도어프로덕츠 스탠다드 로고 티셔츠 5컬러','https://www.gmarket.co.kr/n/superdeal',44,16240, now() + interval '8 hour', false, 3),
  ('11st','식탁정복 소불고기 500g, 3팩','https://deal.11st.co.kr',30,14980, now() + interval '9 hour', false, 1),
  ('11st','바프 허니버터아몬드 파티박스 20gX25','https://deal.11st.co.kr',14,16920, now() + interval '9 hour', true, 2),
  ('11st','바프 허니버터아몬드 마늘버터어묵 20gX25','https://deal.11st.co.kr',14,16920, now() + interval '9 hour', false, 3),
  ('ali','미담채 국산 전라도 배추김치 포기김치 3kg/5kg 외','https://www.aliexpress.com/ssr/300001014/Flashdeal',36,8230, now() + interval '8 hour', false, 1),
  ('ali','요거프레소 200ml 카페라떼 10컵 + 카페모카 10컵','https://www.aliexpress.com/ssr/300001014/Flashdeal',31,14970, now() + interval '8 hour', false, 2),
  ('ali','고기중독 소고기모듬 1kg 구이용 안창살 토시살','https://www.aliexpress.com/ssr/300001014/Flashdeal',25,23150, now() + interval '8 hour', false, 3);

-- 추천딜 ────────────────────────────────
insert into public.curated_deals (seq, product_name, category, affiliate_url, discount_rate, sale_price, admin_note) values
  (8,'필립스 5000 시리즈 에어프라이어 대용량 6.2L','가전','https://link.coupang.com/a/example8',33,129000,'용량 큰데 자리 안 차지함. 4인 가족도 한 번에 끝.'),
  (7,'오늘의집 워시드 코튼 사계절 차렵이불 세트','생활','https://link.coupang.com/a/example7',28,39900,'촉감 미쳤다. 이 가격에 이 퀄리티 흔치 않음.'),
  (6,'한샘 멀바우 4단 원목 선반 책장 (화이트/오크)','가구','https://link.coupang.com/a/example6',41,58000,'조립 쉽고 마감 깔끔. 자취방 분위기 살아남.'),
  (5,'애경 트리오 액체형 주방세제 1.2L x 4개','생활','https://link.coupang.com/a/example5',30,11900,'어차피 쓰는 거 쟁여두기 좋은 타이밍.'),
  (4,'테팔 매직핸즈 인덕션 프라이팬 3종 세트','주방','https://link.coupang.com/a/example4',52,49900,'손잡이 분리형이라 수납 굿. 인덕션 겸용.'),
  (3,'곰곰 국내산 신선 계란 30구 (대란)','식품','https://link.coupang.com/a/example3',20,7980,'로켓프레시 새벽배송. 가성비 끝.'),
  (2,'락앤락 비스프리 모듈러 밀폐용기 24P 풀세트','주방','https://link.coupang.com/a/example2',45,32900,'주방 정리 끝판왕. 이 구성에 이 가격은 거의 못 봄.'),
  (1,'샤오미 미지아 무선 청소기 G10 플러스 가정용 핸디','가전','https://link.coupang.com/a/example1',38,189000,'흡입력 대비 가격이 깡패. 원룸·전세살이 필수템.');

-- 나눔이벤트 ────────────────────────────────
insert into public.giveaways (type, title, prize_name, description, start_at, end_at, winner_count) values
  ('weekly','이번 주 살림 나눔','락앤락 비스프리 밀폐용기 14P 세트','약 1만원대 살림템을 매주 5분께. 회원가입 + 마케팅 동의로 응모.', now() - interval '2 day', now() + interval '5 day', 5),
  ('weekly','다음 주 예고 — 주방 소모품 나눔','곰곰 주방 소모품 종합세트','곧 시작합니다. 회원이면 오픈 시 알림을 보내드려요.', now() + interval '5 day', now() + interval '12 day', 5),
  ('monthly','6월의 대형 경품','다이슨 에어랩 멀티 스타일러 컴플리트','이달의 대형 경품(약 60만원 상당)을 추첨으로 단 한 분께 몰아드립니다.', now() - interval '10 day', now() + interval '18 day', 1);
