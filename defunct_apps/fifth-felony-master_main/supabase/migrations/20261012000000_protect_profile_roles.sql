-- Prevent user-controlled role assignment and restrict profile reads to the owner.
create or replace function prevent_profile_role_escalation()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.role := 'member';
    elsif new.role is distinct from old.role then
      raise exception 'profile role is managed by administrators';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on profiles;
create trigger profiles_protect_role before insert or update on profiles
for each row execute function prevent_profile_role_escalation();

revoke update on profiles from anon, authenticated;
grant update (full_name, city, bio, goals) on profiles to authenticated;

drop policy if exists "profiles readable" on profiles;
drop policy if exists "profiles readable own" on profiles;
create policy "profiles readable own" on profiles for select using (auth.uid() = id);
