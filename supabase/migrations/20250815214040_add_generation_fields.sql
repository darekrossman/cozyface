alter table "public"."generations" alter column "pooled_prompt_embed_scale" set data type numeric(6,3) using "pooled_prompt_embed_scale"::numeric(6,3);

alter table "public"."generations" alter column "prompt_embed_scale" set data type numeric(6,3) using "prompt_embed_scale"::numeric(6,3);

alter table "public"."generations" alter column "reference_scale" set data type numeric(6,3) using "reference_scale"::numeric(6,3);


