-- Learning content, moved out of src/content/learning.ts so it can grow past
-- the 5 lessons + 12 cards that ship in the bundle.
--
-- Content is SHARED, not per-user: every signed-in learner reads the same rows.
-- Nobody can write it — authoring happens through the service role.

create table if not exists public.lang_units (
  id          text primary key,
  title       text        not null,
  description text        not null default '',
  cefr        text        not null default 'A2',
  sort_order  integer     not null default 0,
  published   boolean     not null default false,
  created_at  timestamptz not null default now(),
  constraint lang_units_cefr_ck check (cefr in ('A1','A2','B1','B2','C1','C2'))
);

create table if not exists public.lang_lesson_items (
  id         text primary key,
  unit_id    text    not null references public.lang_units (id) on delete cascade,
  prompt     text    not null,
  hint       text    not null default 'Translate to English',
  answer     text[]  not null,
  bank       text[]  not null,
  skill      text    not null,
  cefr       text    not null default 'A2',
  sort_order integer not null default 0,
  constraint lang_lesson_skill_ck check (skill in ('speaking','listening','vocabulary','grammar','reading')),
  constraint lang_lesson_cefr_ck  check (cefr in ('A1','A2','B1','B2','C1','C2')),
  -- Integrity the app relies on but never checked: the exercise is unsolvable
  -- if any answer token is missing from the word bank, and trivial if the bank
  -- offers no distractors. Enforced here so bad content cannot be stored.
  constraint lang_lesson_answer_in_bank_ck check (bank @> answer),
  constraint lang_lesson_has_distractors_ck check (
    array_length(bank, 1) > array_length(answer, 1)
  ),
  constraint lang_lesson_answer_nonempty_ck check (array_length(answer, 1) >= 2)
);

create table if not exists public.lang_vocab (
  id          text primary key,
  unit_id     text    not null references public.lang_units (id) on delete cascade,
  term        text    not null,
  translation text    not null,
  ipa         text    not null default '',
  cefr        text    not null default 'A2',
  sort_order  integer not null default 0,
  constraint lang_vocab_cefr_ck check (cefr in ('A1','A2','B1','B2','C1','C2'))
);

create table if not exists public.lang_conv_steps (
  id         text primary key,
  unit_id    text    not null references public.lang_units (id) on delete cascade,
  step_order integer not null,
  tutor_line text    not null,
  -- [{ text, good, tip? }] — shape validated by the authoring script.
  options    jsonb   not null,
  constraint lang_conv_options_ck check (jsonb_typeof(options) = 'array')
);

create index if not exists lang_lesson_items_unit_idx on public.lang_lesson_items (unit_id, sort_order);
create index if not exists lang_vocab_unit_idx        on public.lang_vocab (unit_id, sort_order);
create index if not exists lang_conv_steps_unit_idx   on public.lang_conv_steps (unit_id, step_order);

alter table public.lang_units        enable row level security;
alter table public.lang_lesson_items enable row level security;
alter table public.lang_vocab        enable row level security;
alter table public.lang_conv_steps   enable row level security;

-- Read-only, and only what's published. No insert/update/delete policy exists,
-- so writes are denied for `authenticated` — authoring uses the service role.
create policy lang_units_read on public.lang_units
  for select to authenticated using (published);

create policy lang_lesson_items_read on public.lang_lesson_items
  for select to authenticated
  using (exists (select 1 from public.lang_units u where u.id = unit_id and u.published));

create policy lang_vocab_read on public.lang_vocab
  for select to authenticated
  using (exists (select 1 from public.lang_units u where u.id = unit_id and u.published));

create policy lang_conv_steps_read on public.lang_conv_steps
  for select to authenticated
  using (exists (select 1 from public.lang_units u where u.id = unit_id and u.published));
