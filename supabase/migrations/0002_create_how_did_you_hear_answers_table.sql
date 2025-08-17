-- Migration: create table for how users heard about us

create table if not exists public.how_did_you_hear_answers (
  id uuid not null default gen_random_uuid(),
  request_id uuid not null,
  selected_options text[] not null,
  created_at timestamp with time zone not null default now(),
  constraint how_did_you_hear_answers_pkey primary key (id),
  constraint how_did_you_hear_answers_request_id_fkey foreign key (request_id) references design_requests (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_how_did_you_hear_request_id on public.how_did_you_hear_answers using btree (request_id) TABLESPACE pg_default;
