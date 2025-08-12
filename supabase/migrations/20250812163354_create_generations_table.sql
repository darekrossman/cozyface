
  create table "public"."generations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "prompt" text not null,
    "guidance" numeric(3,1) not null,
    "steps" integer not null,
    "aspect_ratio" text not null,
    "output_format" text not null,
    "batch_size" integer not null,
    "images" jsonb not null default '[]'::jsonb,
    "is_loading" boolean not null default true,
    "error" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."generations" enable row level security;

CREATE INDEX generations_created_at_idx ON public.generations USING btree (created_at DESC);

CREATE INDEX generations_is_loading_idx ON public.generations USING btree (is_loading) WHERE (is_loading = true);

CREATE UNIQUE INDEX generations_pkey ON public.generations USING btree (id);

CREATE INDEX generations_user_id_idx ON public.generations USING btree (user_id);

alter table "public"."generations" add constraint "generations_pkey" PRIMARY KEY using index "generations_pkey";

alter table "public"."generations" add constraint "generations_batch_size_check" CHECK (((batch_size >= 1) AND (batch_size <= 10))) not valid;

alter table "public"."generations" validate constraint "generations_batch_size_check";

alter table "public"."generations" add constraint "generations_guidance_check" CHECK (((guidance >= (0)::numeric) AND (guidance <= (20)::numeric))) not valid;

alter table "public"."generations" validate constraint "generations_guidance_check";

alter table "public"."generations" add constraint "generations_steps_check" CHECK (((steps >= 1) AND (steps <= 100))) not valid;

alter table "public"."generations" validate constraint "generations_steps_check";

alter table "public"."generations" add constraint "generations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."generations" validate constraint "generations_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."generations" to "anon";

grant insert on table "public"."generations" to "anon";

grant references on table "public"."generations" to "anon";

grant select on table "public"."generations" to "anon";

grant trigger on table "public"."generations" to "anon";

grant truncate on table "public"."generations" to "anon";

grant update on table "public"."generations" to "anon";

grant delete on table "public"."generations" to "authenticated";

grant insert on table "public"."generations" to "authenticated";

grant references on table "public"."generations" to "authenticated";

grant select on table "public"."generations" to "authenticated";

grant trigger on table "public"."generations" to "authenticated";

grant truncate on table "public"."generations" to "authenticated";

grant update on table "public"."generations" to "authenticated";

grant delete on table "public"."generations" to "service_role";

grant insert on table "public"."generations" to "service_role";

grant references on table "public"."generations" to "service_role";

grant select on table "public"."generations" to "service_role";

grant trigger on table "public"."generations" to "service_role";

grant truncate on table "public"."generations" to "service_role";

grant update on table "public"."generations" to "service_role";


  create policy "Users can delete their own generations"
  on "public"."generations"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own generations"
  on "public"."generations"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update their own generations"
  on "public"."generations"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own generations"
  on "public"."generations"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER generations_updated_at BEFORE UPDATE ON public.generations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


