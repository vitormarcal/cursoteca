create table course_sections (
    id bigserial primary key,
    course_id bigint not null references courses(id) on delete cascade,
    parent_id bigint references course_sections(id) on delete cascade,
    title varchar(180) not null,
    slug varchar(220) not null,
    description text not null,
    position integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index uq_course_sections_root_slug
    on course_sections (course_id, slug)
    where parent_id is null;

create unique index uq_course_sections_sibling_slug
    on course_sections (course_id, parent_id, slug)
    where parent_id is not null;

create index idx_course_sections_parent_position
    on course_sections (course_id, parent_id, position, id);
