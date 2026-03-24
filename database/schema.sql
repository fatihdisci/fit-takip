create table if not exists workout_logs (
  id bigint generated always as identity primary key,
  workout_date date not null unique,
  day_key text not null check (day_key in ('monday', 'wednesday', 'friday')),
  day_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_exercise_logs (
  id bigint generated always as identity primary key,
  workout_id bigint not null references workout_logs(id) on delete cascade,
  exercise_name text not null,
  pairing_label text,
  exercise_kind text not null check (exercise_kind in ('strength', 'cardio')),
  target_summary text not null,
  exercise_order integer not null
);

create table if not exists workout_set_logs (
  id bigint generated always as identity primary key,
  exercise_log_id bigint not null references workout_exercise_logs(id) on delete cascade,
  set_number integer not null,
  target_reps integer,
  actual_weight_kg numeric(8, 2),
  actual_reps integer,
  target_duration_minutes integer,
  actual_duration_minutes integer,
  target_calories integer,
  actual_calories integer,
  completed boolean not null default false
);

create index if not exists idx_workout_logs_workout_date on workout_logs (workout_date desc);
create index if not exists idx_workout_exercise_logs_workout_id on workout_exercise_logs (workout_id);
create index if not exists idx_workout_set_logs_exercise_log_id on workout_set_logs (exercise_log_id);

