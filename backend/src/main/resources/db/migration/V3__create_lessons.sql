create table lessons (
    id bigserial primary key,
    course_id bigint not null references courses(id) on delete cascade,
    section_id bigint references course_sections(id) on delete set null,
    title varchar(180) not null,
    description text not null,
    video_path text not null unique,
    position integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_lessons_course_section_position
    on lessons (course_id, section_id, position, id);
