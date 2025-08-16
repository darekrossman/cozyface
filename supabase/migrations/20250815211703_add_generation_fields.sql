alter table "public"."generations" add column "height" integer not null;

alter table "public"."generations" add column "image_urls" text[];

alter table "public"."generations" add column "pooled_prompt_embed_scale" numeric(3,1);

alter table "public"."generations" add column "prompt_embed_scale" numeric(3,1);

alter table "public"."generations" add column "reference_scale" numeric(3,1);

alter table "public"."generations" add column "seed" integer;

alter table "public"."generations" add column "width" integer not null;


