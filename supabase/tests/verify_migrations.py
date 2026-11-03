#!/usr/bin/env python3
"""
Validate that every supabase/migrations/*.sql file applies to a real PostgreSQL
engine, then assert the objects the application depends on exist.

This is the workaround for environments without Docker / the Supabase CLI:
`pgserver` ships a real PostgreSQL binary as a PyPI wheel.

    pip install pgserver
    python3 supabase/tests/verify_migrations.py
"""

from __future__ import annotations

import sys

from pg import Database, SqlError

REQUIRED_FUNCTIONS = [
    "public.get_shared_simulation(text)",
    "public.share_simulation(uuid)",
    "public.spend_credit(uuid)",
    "public.refund_credit(uuid)",
    "public.award_referral(uuid,uuid)",
    "public.is_admin(uuid)",
    "public.handle_new_user()",
]

REQUIRED_TABLES = [
    "public.profiles",
    "public.simulations",
    "public.agents",
    "public.simulation_groups",
    "public.referral_events",
    "public.custom_personas",
    "public.feature_flags",
    "public.system_settings",
    "public.error_logs",
]


def main() -> int:
    failures: list[str] = []

    with Database() as db:
        print("Bootstrapping Supabase-compatible schemas (auth, storage, roles)")
        db.bootstrap_supabase()

        print("Applying migrations")
        try:
            count = db.apply_migrations()
        except SqlError as exc:
            print(f"\nMIGRATION FAILED\n{exc}")
            return 1
        print(f"  ok   {count} statements applied cleanly\n")

        print("Objects the application depends on")
        for signature in REQUIRED_FUNCTIONS:
            exists = db.scalar(f"SELECT to_regprocedure('{signature}') IS NOT NULL;") == "t"
            print(f"  {'ok  ' if exists else 'FAIL'} function {signature}")
            if not exists:
                failures.append(f"missing function {signature}")

        for table in REQUIRED_TABLES:
            exists = db.scalar(f"SELECT to_regclass('{table}') IS NOT NULL;") == "t"
            print(f"  {'ok  ' if exists else 'FAIL'} table {table}")
            if not exists:
                failures.append(f"missing table {table}")

        print("\nSchema invariants")
        checks: list[tuple[str, str, str]] = [
            (
                "every public table has RLS enabled",
                """
                SELECT count(*) FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
                """,
                "0",
            ),
            (
                "simulations.share_token has no auto-generated default",
                """
                SELECT COALESCE(column_default, 'NULL') FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'simulations'
                  AND column_name = 'share_token'
                """,
                "NULL",
            ),
            (
                "custom_personas.industry is text[]",
                """
                SELECT data_type FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'custom_personas'
                  AND column_name = 'industry'
                """,
                "ARRAY",
            ),
            (
                "simulation_groups.user_id defaults to auth.uid()",
                """
                SELECT CASE WHEN column_default ILIKE '%auth.uid()%' THEN 'yes' ELSE 'no' END
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'simulation_groups'
                  AND column_name = 'user_id'
                """,
                "yes",
            ),
        ]

        for label, query, expected in checks:
            actual = db.scalar(query)
            passed = actual == expected
            print(f"  {'ok  ' if passed else 'FAIL'} {label}" + ("" if passed else f" (got {actual!r})"))
            if not passed:
                failures.append(f"{label} (got {actual!r})")

        print("\nGrants")
        grant_checks = [
            ("anon cannot execute is_admin()", "SELECT has_function_privilege('anon','public.is_admin(uuid)','EXECUTE');", "f"),
            ("authenticated cannot execute spend_credit()", "SELECT has_function_privilege('authenticated','public.spend_credit(uuid)','EXECUTE');", "f"),
            ("service_role can execute spend_credit()", "SELECT has_function_privilege('service_role','public.spend_credit(uuid)','EXECUTE');", "t"),
            ("anon can read shared reports by RPC", "SELECT has_function_privilege('anon','public.get_shared_simulation(text)','EXECUTE');", "t"),
        ]
        for label, query, expected in grant_checks:
            actual = db.scalar(query)
            passed = actual == expected
            print(f"  {'ok  ' if passed else 'FAIL'} {label}" + ("" if passed else f" (got {actual!r})"))
            if not passed:
                failures.append(f"{label} (got {actual!r})")

        writable = db.psql(
            "COPY (SELECT DISTINCT column_name FROM information_schema.column_privileges "
            "WHERE table_name='profiles' AND grantee='authenticated' AND privilege_type='UPDATE') "
            "TO STDOUT;"
        ).split()
        privileged = {"plan_tier", "credits_remaining", "is_admin", "is_suspended", "total_referrals"}
        leaked = sorted(privileged & set(writable))
        print(
            "  ok   profiles: privileged columns are not writable by authenticated"
            if not leaked
            else f"  FAIL profiles: writable privileged columns {leaked}"
        )
        if leaked:
            failures.append(f"profiles writable columns {leaked}")

    print()
    if failures:
        print(f"{len(failures)} FAILURE(S):")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("All migrations applied cleanly and schema invariants hold.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
