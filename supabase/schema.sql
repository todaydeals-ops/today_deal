-- 오늘의딜 — Supabase 스키마
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행.
-- 기획안 8.2 + 프론트 구현(추천딜 seq/category, 나눔 type, 응모권 슬롯) 반영.

-- ──────────────────────────────────────────────
-- 1) 타임딜
-- ──────────────────────────────────────────────
create table if not exists public.deals (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null check (platform in ('gmarket','11st','ali')),
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
create index if not exists deals_platform_order on public.deals (platform, display_order);

-- ──────────────────────────────────────────────
-- 2) 추천딜 (쿠팡 큐레이션, 수동 등록)
-- ──────────────────────────────────────────────
create table if not exists public.curated_deals (
  id            uuid primary key default gen_random_uuid(),
  seq           int not null,
  product_name  text not null,
  category      text not null check (category in ('가전','주방','생활','가구','식품')),
  image_url     text,
  affiliate_url text not null,
  discount_rate int,
  sale_price    int not null,
  admin_note    text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 3) 회원 프로필 (Supabase Auth 연동)
-- ──────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  provider          text,            -- 'kakao' | 'naver'
  marketing_consent boolean default false,
  consent_at        timestamptz,
  created_at        timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 4) 나눔이벤트 (주간/월간)
-- ──────────────────────────────────────────────
create table if not exists public.giveaways (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('weekly','monthly')),
  title        text not null,
  prize_name   text not null,
  prize_image  text,
  description  text,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  winner_count int not null default 1,
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 5) 응모권 (회원 × 이벤트) — 방문 슬롯 + 광고
-- ──────────────────────────────────────────────
create table if not exists public.giveaway_entries (
  id            uuid primary key default gen_random_uuid(),
  giveaway_id   uuid not null references public.giveaways(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  visit_entries int default 0,
  ad_entries    int default 0,
  claimed_slots int[] default '{}',   -- 오늘 응모한 슬롯(0~3)
  claim_day     date,
  updated_at    timestamptz default now(),
  unique (giveaway_id, user_id)
);

-- ──────────────────────────────────────────────
-- 6) 당첨자 (추첨 결과)
-- ──────────────────────────────────────────────
create table if not exists public.giveaway_winners (
  id          uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references public.giveaways(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null, -- 합성/탈퇴 대비 nullable
  name        text not null,        -- 마스킹 표시 이름
  entries     int not null default 0,
  drawn_at    timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 7) 뉴스레터 발송 로그
-- ──────────────────────────────────────────────
create table if not exists public.newsletter_sends (
  id         uuid primary key default gen_random_uuid(),
  subject    text not null,
  sent_count int not null default 0,
  sent_at    timestamptz default now()
);

-- ──────────────────────────────────────────────
-- RLS (Row Level Security)
--  공개 콘텐츠: 익명 읽기 허용 / 쓰기는 service_role(서버)만
--  개인 데이터: 본인만
-- ──────────────────────────────────────────────
alter table public.deals            enable row level security;
alter table public.curated_deals    enable row level security;
alter table public.giveaways        enable row level security;
alter table public.giveaway_winners enable row level security;
alter table public.profiles         enable row level security;
alter table public.giveaway_entries enable row level security;

-- 공개 읽기
create policy "public read deals"    on public.deals            for select using (true);
create policy "public read curated"  on public.curated_deals    for select using (is_active);
create policy "public read giveaways" on public.giveaways       for select using (true);
create policy "public read winners"  on public.giveaway_winners for select using (true);

-- 본인 프로필
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- 본인 응모권
create policy "own entries select" on public.giveaway_entries for select using (auth.uid() = user_id);
create policy "own entries insert" on public.giveaway_entries for insert with check (auth.uid() = user_id);
create policy "own entries update" on public.giveaway_entries for update using (auth.uid() = user_id);

-- ※ deals/curated/giveaways/winners/newsletter 쓰기, 추첨은 service_role 키(RLS 우회)로 서버에서 수행.
