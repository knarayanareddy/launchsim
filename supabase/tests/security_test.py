#!/usr/bin/env python3
"""
Behavioural tests for the RLS / grant hardening.

`verify_migrations.py` proves the SQL applies; this proves the *guarantees* hold.
Each check connects as the `authenticated` or `anon` role and attempts the exact
attack identified in the code review.

    pip install pgserver
    python3 supabase/tests/security_test.py
"""

from __future__ import annotations

import sys

from pg import Database, SqlError

ALICE = "11111111-1111-1111-1111-111111111111"
BOB = "22222222-2222-2222-2222-222222222222"
SIM = "33333333-3333-3333-3333-333333333333"

ALICE_S = {"uid": ALICE, "role": "authenticated"}
BOB_S = {"uid": BOB, "role": "authenticated"}
ANON_S = {"uid": "", "role": "anon"}

results: list[tuple[str, bool, str]] = []


def check(name: str, passed: bool, detail: str = "") -> None:
    results.append((name, passed, detail))
    suffix = f"  -> {detail}" if detail and not passed else ""
    print(f"  {'PASS' if passed else 'FAIL'}  {name}{suffix}")


def main() -> int:
    with Database() as db:
        db.bootstrap_supabase()
        db.apply_migrations()

        # Signups normally create profiles via on_auth_user_created.
        db.psql(f"""
        INSERT INTO auth.users (id, email) VALUES
          ('{ALICE}', 'alice@example.com'),
          ('{BOB}',   'bob@example.com');
        UPDATE public.profiles SET full_name = 'Alice' WHERE id = '{ALICE}';
        UPDATE public.profiles SET full_name = 'Bob'   WHERE id = '{BOB}';
        """)

        created = db.scalar("SELECT count(*) FROM public.profiles WHERE referral_code IS NOT NULL;")
        print(f"  info  profiles auto-created by trigger with referral codes: {created}\n")

        # ==================================================================
        print("1. Privilege escalation via profiles")
        # ==================================================================
        for column, value in [
            ("is_admin", "true"),
            ("credits_remaining", "99999"),
            ("plan_tier", "'enterprise'"),
            ("total_referrals", "500"),
            ("is_suspended", "true"),
        ]:
            check(
                f"cannot write {column} on your own profile",
                db.denied(f"UPDATE public.profiles SET {column} = {value} WHERE id = '{ALICE}';", **ALICE_S),
            )

        check(
            "can still edit your own display name",
            not db.denied(f"UPDATE public.profiles SET full_name = 'Alice A.' WHERE id = '{ALICE}';", **ALICE_S),
        )

        # UPDATE policies on other people's rows match zero rows rather than
        # raising, so this asserts the value did not change.
        db.session(f"UPDATE public.profiles SET full_name = 'Hacked' WHERE id = '{BOB}';", **ALICE_S)
        hacked = db.scalar(f"SELECT count(*) FROM public.profiles WHERE id = '{BOB}' AND full_name = 'Hacked';")
        check("cannot edit another user's profile", hacked == "0", f"rows changed: {hacked}")

        # ==================================================================
        print("\n2. Simulation privacy and share tokens")
        # ==================================================================
        db.psql(f"""
        INSERT INTO public.simulations (id, user_id, product_description, overall_score)
        VALUES ('{SIM}', '{ALICE}', 'Alice confidential pitch', 70);
        """)

        visible = db.scalar(f"SELECT count(*) FROM public.simulations WHERE id = '{SIM}';", **BOB_S)
        check("another user cannot read an unshared simulation", visible == "0", f"rows: {visible}")

        own = db.scalar(f"SELECT count(*) FROM public.simulations WHERE id = '{SIM}';", **ALICE_S)
        check("the owner can read their own simulation", own == "1", f"rows: {own}")

        agents = db.scalar(f"SELECT count(*) FROM public.agents WHERE simulation_id = '{SIM}';", **BOB_S)
        check("another user cannot read agents of an unshared simulation", agents == "0")

        check(
            "cannot inject agents into someone else's report",
            db.denied(
                "INSERT INTO public.agents (simulation_id, name, archetype, personality_type) "
                f"VALUES ('{SIM}', 'Mallory', 'Attacker', 'skeptic');",
                **BOB_S,
            ),
        )

        # Sharing is opt-in and owner-scoped.
        check(
            "get_shared_simulation returns nothing for an unknown token",
            db.scalar("SELECT count(*) FROM public.get_shared_simulation('notevenatoken');") == "0",
        )

        token = db.scalar(f"SELECT public.share_simulation('{SIM}');", **ALICE_S)
        check("owner can mint a share token", len(token) >= 8, token)

        bob_token = db.scalar(f"SELECT public.share_simulation('{SIM}');", **BOB_S)
        # COPY renders SQL NULL as \N, and the UPDATE policy means a non-owner
        # simply matches zero rows.
        check("non-owner gets no token", bob_token in ("", "\\N"), f"got {bob_token!r}")

        still_private = db.scalar(f"SELECT count(*) FROM public.simulations WHERE id = '{SIM}';", **BOB_S)
        check("minting a token does not widen table reads for others", still_private == "0")

        anon_shared = db.scalar(f"SELECT count(*) FROM public.get_shared_simulation('{token}');", **ANON_S)
        check("a shared report is readable by anon through the token RPC", anon_shared == "1", f"rows: {anon_shared}")

        check(
            "anonymous users cannot read the simulations table directly",
            db.scalar(f"SELECT count(*) FROM public.simulations WHERE id = '{SIM}';", **ANON_S) == "0",
        )

        # ==================================================================
        print("\n3. Credits and referrals are service-role only")
        # ==================================================================
        for fn, args in [
            ("spend_credit", f"'{BOB}'"),
            ("refund_credit", f"'{BOB}'"),
            ("award_referral", f"'{ALICE}', '{BOB}'"),
        ]:
            check(f"client cannot call {fn}()", db.denied(f"SELECT public.{fn}({args});", **BOB_S))

        before = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{BOB}';"))
        db.psql(f"SELECT public.spend_credit('{BOB}');")
        after = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{BOB}';"))
        check("spend_credit decrements atomically", after == before - 1, f"{before} -> {after}")

        db.psql(f"UPDATE public.profiles SET credits_remaining = 0 WHERE id = '{BOB}';")
        spent = db.scalar(f"SELECT public.spend_credit('{BOB}');").lower()
        remaining = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{BOB}';"))
        check(
            "spend_credit refuses at zero credits",
            spent == "f" and remaining == 0,
            f"returned {spent}, remaining {remaining}",
        )

        refund_before = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{BOB}';"))
        db.psql(f"SELECT public.refund_credit('{BOB}');")
        refund_after = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{BOB}';"))
        check("refund_credit restores a credit", refund_after == refund_before + 1, f"{refund_before} -> {refund_after}")

        try:
            db.psql(f"SELECT public.award_referral('{ALICE}', '{ALICE}');")
            check("award_referral blocks self-referral", False, "no error raised")
        except SqlError as exc:
            check("award_referral blocks self-referral", "self_referral" in str(exc).lower())

        db.psql("DELETE FROM public.referral_events;")
        db.psql(f"UPDATE public.profiles SET credits_remaining = 10, total_referrals = 0 WHERE id = '{ALICE}';")
        db.psql(f"SELECT public.award_referral('{ALICE}', '{BOB}');")
        first = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{ALICE}';"))

        duplicate_rejected = False
        try:
            db.psql(f"SELECT public.award_referral('{ALICE}', '{BOB}');")
        except SqlError as exc:
            duplicate_rejected = "already_processed" in str(exc).lower()
        second = int(db.scalar(f"SELECT credits_remaining FROM public.profiles WHERE id = '{ALICE}';"))

        check("award_referral pays exactly once", first == 13 and second == 13, f"{first} then {second}")
        check("a duplicate referral is rejected with a clear error", duplicate_rejected)

        referred_by = db.scalar(f"SELECT referred_by FROM public.profiles WHERE id = '{BOB}';")
        check("the referee records who referred them", ALICE in referred_by, referred_by)

        # ==================================================================
        print("\n4. Content integrity")
        # ==================================================================
        check(
            "client cannot insert referral events directly",
            db.denied(
                f"INSERT INTO public.referral_events (referrer_id, referred_id) VALUES ('{BOB}', '{ALICE}');",
                **BOB_S,
            ),
        )

        check(
            "custom_personas.industry accepts a text array",
            not db.denied(
                "INSERT INTO public.custom_personas (user_id, name, archetype, personality_type, industry) "
                f"VALUES ('{ALICE}', 'P', 'PM', 'pragmatist', ARRAY['saas','fintech']);",
                **ALICE_S,
            ),
        )

        pid = db.scalar(f"SELECT id FROM public.custom_personas WHERE user_id = '{ALICE}' LIMIT 1;")
        db.session(f"UPDATE public.custom_personas SET is_public = true WHERE id = '{pid}';", **BOB_S)
        published = db.scalar(f"SELECT COALESCE(is_public, false)::text FROM public.custom_personas WHERE id = '{pid}';")
        check("cannot publish another user's persona", published in ("f", "false"), published)

        db.session(f"UPDATE public.custom_personas SET is_public = true WHERE id = '{pid}';", **ALICE_S)
        own = db.scalar(f"SELECT COALESCE(is_public, false)::text FROM public.custom_personas WHERE id = '{pid}';")
        check("owner can publish their own persona", own in ("t", "true"), own)

        # ==================================================================
        print("\n5. Operational tables")
        # ==================================================================
        flags = db.scalar("SELECT count(*) FROM public.feature_flags;", **ALICE_S)
        check("authenticated users can read feature flags", flags.isdigit(), flags)

        # UPDATE policies filter rows instead of raising, so assert no state change.
        before_flag = db.scalar("SELECT enabled FROM public.feature_flags WHERE flag_name = 'notion_export';")
        db.session(
            "UPDATE public.feature_flags SET enabled = false WHERE flag_name = 'notion_export';",
            **ALICE_S,
        )
        after_flag = db.scalar("SELECT enabled FROM public.feature_flags WHERE flag_name = 'notion_export';")
        check("non-admins cannot toggle feature flags", before_flag == after_flag, f"{before_flag} -> {after_flag}")

        check(
            "users can log their own errors",
            not db.denied(
                f"INSERT INTO public.error_logs (user_id, error_message, page) "
                f"VALUES ('{ALICE}', 'boom', '/studio');",
                **ALICE_S,
            ),
        )

        check(
            "users cannot spoof another user's error log",
            db.denied(
                f"INSERT INTO public.error_logs (user_id, error_message) VALUES ('{BOB}', 'spoofed');",
                **ALICE_S,
            ),
        )

        logs = db.scalar(f"SELECT count(*) FROM public.error_logs WHERE user_id = '{ALICE}';", **BOB_S)
        check("non-admins cannot read other users' error logs", logs == "0", f"rows: {logs}")

        # An admin (flag flipped by the service role) can read them.
        db.psql(f"UPDATE public.profiles SET is_admin = true WHERE id = '{BOB}';")
        admin_logs = db.scalar(f"SELECT count(*) FROM public.error_logs WHERE user_id = '{ALICE}';", **BOB_S)
        check("admins can read error logs", admin_logs != "0", f"rows: {admin_logs}")

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    if failed:
        print("\nFailures:")
        for name, _, detail in failed:
            print(f"  - {name} {detail}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
