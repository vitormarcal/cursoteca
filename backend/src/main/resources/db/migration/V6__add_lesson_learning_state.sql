alter table lessons
    add column completed_at timestamptz,
    add column last_accessed_at timestamptz;

create index idx_lessons_last_accessed_at
    on lessons (last_accessed_at desc)
    where last_accessed_at is not null;
