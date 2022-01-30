
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


DROP INDEX "public"."person_location_idx";


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


create index "person_location_idx" on "person" using GiST ("location");

vacuum analyze "person" [("location")];


DROP INDEX "public"."location_location_idx";


insert into location (hour,
                      "personId",
                      "diseasePhase",
                      location)
select hour,
       "personId",
       lower("diseasePhase")::location_diseasephase_enum,
       ST_SetSRID(ST_MakePoint("currentLon", "currentLat"), 4326)
from tempdata;


create index "location_location_idx" on "location" using GiST ("location");

vacuum analyze "location" [("location")];


drop table tempdata;


alter system
reset all;


select pg_reload_conf();

