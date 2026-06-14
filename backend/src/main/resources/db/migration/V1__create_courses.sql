create table courses (
    id bigserial primary key,
    name varchar(180) not null,
    slug varchar(220) not null unique,
    description text not null,
    image_path text not null,
    assets_path text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_courses_created_at on courses (created_at desc);
