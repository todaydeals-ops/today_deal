-- 오늘의딜 — 실제 운영(LIVE) 스키마 단일 기준 파일
-- 프로젝트: wkkboqsbigvmtaagxcew (Seoul)
-- ⚠️ 이 파일이 현재 실제 DB 기준입니다. (구버전 schema.sql은 초기 기획안 — auth/profiles 기반이라 미사용)
-- 전부 idempotent(여러 번 실행해도 안전). 새 환경 구축 시 이 파일을 SQL Editor에 통째로 실행.
--
-- 인증: Supabase Auth 미사용. 커스텀 카카오 OAuth → members(id="kakao:<id>").
-- 쓰기/추첨/카운트는 서버에서 service_role로 수행(RLS 우회). 공개 읽기는 anon.

-- ──────────────────────────────────────────────
-- 1) 타임딜 (크롤러 자동 수집)
-- ──────────────────────────────────────────────
create table if not exists public.deals (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null,            -- gmarket | 11st | ali | coupang
  badge          text,                     -- gmarket_openrun | coupang_goldbox | 11st_time ...
  product_name   text not null,
  image_url      text,
  product_url    text not null,
  affiliate_url  text,
  discount_rate  int,
  sale_price     int not null,
  original_price int,
  free_shipping  boolean default false,
  deal_end_at    timestamptz,
  is_soldout     boolean default false,
  collected_at   timestamptz default now(),
  display_order  int default 0
);
alter table public.deals add column if not exists badge text;
create index if not exists deals_order on public.deals (display_order);

-- 영구 딜 스냅샷 (개별 딜 페이지 /deal/[slug] · 404 방지 · 검색/AI 인용)
create table if not exists public.deal_archive (
  slug          text primary key,          -- "<platform>-<goodscode>"
  badge         text,
  platform      text,
  product_name  text not null,
  image_url     text,
  affiliate_url text,
  product_url   text,
  sale_price    int,
  discount_rate int,
  summary       text,                       -- AI 한줄평(백필)
  last_seen     timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 2) 추천딜 (쿠팡 큐레이션 + 쇼츠) — slug/video_url 추가
-- ──────────────────────────────────────────────
create table if not exists public.curated_deals (
  id            uuid primary key default gen_random_uuid(),
  seq           int not null,
  product_name  text not null,
  category      text not null,             -- 가전|주방|생활|가구|식품
  image_url     text,
  affiliate_url text not null,
  discount_rate int,
  sale_price    int not null,
  admin_note    text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);
alter table public.curated_deals add column if not exists slug text;
alter table public.curated_deals add column if not exists video_url text;
create unique index if not exists curated_deals_slug_key on public.curated_deals(slug);

-- ──────────────────────────────────────────────
-- 3) 회원 (커스텀 카카오 OAuth)
-- ──────────────────────────────────────────────
create table if not exists public.members (
  id                text primary key,       -- "kakao:12345"
  nickname          text,
  provider          text not null default 'kakao',
  profile_image     text,
  marketing_consent boolean not null default true,
  created_at        timestamptz not null default now(),
  last_login_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 4) 나눔이벤트 — affiliate_url/draw_at 추가
-- ──────────────────────────────────────────────
create table if not exists public.giveaways (
  id           uuid primary key default gen_random_uuid(),
  type         text not null default 'weekly',  -- weekly | monthly
  title        text not null,
  prize_name   text not null,
  prize_image  text,
  description  text,
  start_at     timestamptz not null default now(),
  end_at       timestamptz not null,
  winner_count int not null default 1,
  created_at   timestamptz not null default now()
);
alter table public.giveaways add column if not exists affiliate_url text;
alter table public.giveaways add column if not exists draw_at timestamptz;

-- ──────────────────────────────────────────────
-- 5) 응모권 (회원 × 이벤트) — 서버 권위
-- ──────────────────────────────────────────────
create table if not exists public.entries (
  member_id     text not null,
  giveaway_id   text not null,
  visit_entries int not null default 0,
  ad_entries    int not null default 0,
  ref_channels  text[] not null default '{}',
  claim_day     date,
  claimed_slots int[] not null default '{}',
  updated_at    timestamptz not null default now(),
  primary key (member_id, giveaway_id)
);

-- ──────────────────────────────────────────────
-- 6) 추첨 결과 (공개 발표)
-- ──────────────────────────────────────────────
create table if not exists public.draw_results (
  giveaway_id text primary key,
  winners     jsonb not null default '[]',   -- [{id,name,entries}]
  pool_size   int not null default 0,
  drawn_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 7) 사이트 설정 (추천딜 헤더 배너/프로필 등)
-- ──────────────────────────────────────────────
create table if not exists public.settings (
  key        text primary key,             -- 'recommended_header'
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 8) 조회수 — IP당 하루 1회 합산
-- ──────────────────────────────────────────────
create table if not exists public.view_counter (
  id        int primary key default 1,
  total     bigint not null default 0,
  day       date not null default current_date,
  day_count bigint not null default 0
);
insert into public.view_counter (id) values (1) on conflict (id) do nothing;

create table if not exists public.view_visits (
  ip  text not null,
  day date not null default current_date,
  primary key (ip, day)
);

create or replace function public.bump_views_ip(p_ip text)
returns table(today_count bigint, total_count bigint)
language plpgsql
as $$
declare inserted int;
begin
  insert into public.view_visits (ip, day)
  values (coalesce(nullif(p_ip,''),'unknown'), current_date)
  on conflict (ip, day) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 1 then
    update public.view_counter set total = total + 1,
      day_count = case when day = current_date then day_count + 1 else 1 end,
      day = current_date where id = 1;
  else
    update public.view_counter set day_count = case when day = current_date then day_count else 0 end,
      day = current_date where id = 1;
  end if;
  return query select day_count, total from public.view_counter where id = 1;
end;
$$;

-- 참고: deals/curated/giveaways/members/entries/draw_results/settings 쓰기는
--       서버에서 service_role 키로 수행(RLS 우회)하므로 RLS 정책은 생략(공개 읽기도 서버 anon/admin 경유).
