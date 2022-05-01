
alter system
set commit_delay = 100000;


alter system
set maintenance_work_mem = 1024;


alter system
set synchronous_commit = off;


alter system
set work_mem = 1024;


select pg_reload_conf();


create table tempdata (hour real, "personId" integer, "personType" text, age integer, gender text, "homeId" integer, "homeSubId" integer, "currentActivity" text, "currentLat" decimal, "currentLon" decimal, "homeLat" decimal, "homeLon" decimal, "diseasePhase" text, "workId" integer, "schoolId" integer);

copy tempdata
from program 'gzip -dc /var/lib/postgresql/data/data.csv.gz'
delimiter ',' csv header;


drop index "public"."person_location_idx";


insert into person (id, type, age, gender, "homeId", "homeSubId", "workId", "schoolId", location)
select "personId",
       lower("personType"),
       age,
       lower(gender)::person_gender_enum,
       "homeId",
       "homeSubId",
       "workId",
       "schoolId",
       ST_SetSRID(ST_MakePoint("currentLon", "currentLat"), 4326)
from tempdata
where hour = 0;


create index "person_location_idx" on "person" using gist ("location");

vacuum analyze "person" ("location");


insert into location (hour,
                      "personId",
                      "diseasePhase",
                      location)
select hour,
       "personId",
       lower("diseasePhase")::location_diseasephase_enum,
       ST_SetSRID(ST_MakePoint("currentLon", "currentLat"), 4326)
from tempdata;


create extension if not exists btree_gist;


create index "location_hour_personId_location_idx" on location using gist (hour, "personId", location);

vacuum analyze "location" ("location");


drop table tempdata;

insert into migrations (timestamp, name) values (1635021870426, 'SeedData1635021870426')

alter system
reset all;


select pg_reload_conf();

