create table resources (
    id bigserial primary key,
    course_id bigint not null references courses(id) on delete cascade,
    section_id bigint references course_sections(id) on delete cascade,
    lesson_id bigint references lessons(id) on delete cascade,
    type varchar(20) not null,
    scope varchar(20) not null,
    title varchar(180) not null,
    description text not null,
    url text,
    file_path text unique,
    mime_type varchar(180),
    position integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_resources_type check (type in ('LINK', 'FILE')),
    constraint ck_resources_scope check (scope in ('COURSE', 'SECTION', 'LESSON')),
    constraint ck_resources_target check (
        (scope = 'COURSE' and section_id is null and lesson_id is null)
        or (scope = 'SECTION' and section_id is not null and lesson_id is null)
        or (scope = 'LESSON' and section_id is null and lesson_id is not null)
    ),
    constraint ck_resources_content check (
        (type = 'LINK' and url is not null and file_path is null and mime_type is null)
        or (type = 'FILE' and url is null and file_path is not null and mime_type is not null)
    )
);

create index idx_resources_course_scope_position
    on resources (course_id, scope, position, id);

create index idx_resources_section_position
    on resources (section_id, position, id)
    where section_id is not null;

create index idx_resources_lesson_position
    on resources (lesson_id, position, id)
    where lesson_id is not null;
