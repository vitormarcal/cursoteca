create table lesson_download_jobs (
    id bigserial primary key,
    course_id bigint not null references courses(id) on delete cascade,
    section_id bigint references course_sections(id) on delete set null,
    lesson_id bigint references lessons(id) on delete set null,
    title varchar(180) not null,
    description text not null,
    source_url text not null,
    status varchar(20) not null,
    progress integer not null default 0,
    log text not null default '',
    error text,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz,
    updated_at timestamptz not null default now(),
    constraint ck_download_job_status check (status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    constraint ck_download_job_progress check (progress between 0 and 100)
);

create index idx_lesson_download_jobs_course_created
    on lesson_download_jobs (course_id, created_at desc, id desc);
