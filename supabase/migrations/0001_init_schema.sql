-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text,
  country text,
  category text not null,
  price_per_night int not null,
  max_guests int not null,
  bedrooms int not null,
  beds int not null,
  baths numeric not null,
  images text[] not null default '{}',
  amenities text[] not null default '{}',
  rating numeric(3,2),
  review_count int not null default 0,
  host_name text,
  host_avatar text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index listings_category_idx on public.listings(category);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index reviews_listing_id_idx on public.reviews(listing_id);

-- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests int not null,
  total_price int not null,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  stripe_session_id text,
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_listing_id_idx on public.bookings(listing_id);

-- wishlists
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
create index wishlists_listing_id_idx on public.wishlists(listing_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.reviews enable row level security;
alter table public.bookings enable row level security;
alter table public.wishlists enable row level security;

create policy "listings public read" on public.listings for select to anon, authenticated using (true);
create policy "reviews public read" on public.reviews for select to anon, authenticated using (true);

create policy "profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "bookings select own" on public.bookings for select to authenticated using ((select auth.uid()) = user_id);
create policy "bookings insert own" on public.bookings for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending' and stripe_session_id is null);

create policy "wishlists select own" on public.wishlists for select to authenticated using ((select auth.uid()) = user_id);
create policy "wishlists insert own" on public.wishlists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wishlists delete own" on public.wishlists for delete to authenticated using ((select auth.uid()) = user_id);
