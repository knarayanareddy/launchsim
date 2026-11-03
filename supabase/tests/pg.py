"""
Shared PostgreSQL test harness for validating Supabase migrations locally.

Why this exists
---------------
There is no Docker or Supabase CLI in every CI sandbox, so `supabase db reset`
cannot always be run. `pgserver` provides a real PostgreSQL binary as a PyPI
wheel, which is enough to apply the migrations against an actual engine.

Important: `pgserver.PostgresServer.psql()` captures **stdout only**. Postgres
raises errors on stderr, so a failing statement looks like a silent success.
This module therefore shells out to `psql` directly with
`-v ON_ERROR_STOP=1` and stderr merged into stdout.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys
import tempfile

try:
    import pgserver

    # The binary path constant is not re-exported at package level in every
    # pgserver release, so resolve it from the submodule.
    try:
        from pgserver import POSTGRES_BIN_PATH
    except ImportError:
        from pgserver.postgres_server import POSTGRES_BIN_PATH
except ImportError:  # pragma: no cover - guidance for the runner
    sys.exit("pgserver is required: pip install pgserver")

ROOT = pathlib.Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase" / "migrations"
BOOTSTRAP = ROOT / "supabase" / "tests" / "bootstrap.sql"


class SqlError(RuntimeError):
    """A statement failed in PostgreSQL."""


def split_statements(sql: str) -> list[str]:
    """Split on semicolons outside dollar-quoted function bodies."""
    statements: list[str] = []
    buf: list[str] = []
    dollar_tag: str | None = None
    i = 0

    while i < len(sql):
        if dollar_tag is None:
            m = re.match(r"\$[A-Za-z_]*\$", sql[i:])
            if m:
                dollar_tag = m.group(0)
                buf.append(dollar_tag)
                i += len(dollar_tag)
                continue
        else:
            if sql.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
                continue

        char = sql[i]
        if char == ";" and dollar_tag is None:
            statement = "".join(buf).strip()
            if statement:
                statements.append(statement)
            buf = []
        else:
            buf.append(char)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def strip_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


class Database:
    """A throwaway PostgreSQL instance with a Supabase-shaped bootstrap."""

    def __init__(self) -> None:
        self._data_dir = pathlib.Path(tempfile.mkdtemp(prefix="launchsim-pg-"))
        self.server = pgserver.get_server(str(self._data_dir))
        self._uri = self.server.get_uri()

    # -- lifecycle -------------------------------------------------------
    def __enter__(self) -> "Database":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def close(self) -> None:
        try:
            self.server.cleanup()
        finally:
            import shutil
            shutil.rmtree(self._data_dir, ignore_errors=True)

    # -- execution -------------------------------------------------------
    def psql(self, script: str, *, stop_on_error: bool = True) -> str:
        """Run a psql script. Raises SqlError with psql's own message on failure."""
        args = [str(POSTGRES_BIN_PATH / "psql"), self._uri, "-X", "-q"]
        if stop_on_error:
            args += ["-v", "ON_ERROR_STOP=1"]

        proc = subprocess.run(
            args,
            input=script.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # <- the whole point: errors must be visible
        )
        output = proc.stdout.decode("utf-8", "replace").strip()

        if stop_on_error and (proc.returncode != 0 or "ERROR:" in output):
            raise SqlError(output)
        return output

    def scalar(self, query: str, *, uid: str | None = None, role: str | None = None) -> str:
        """First column of the first row, via COPY (no borders or headers)."""
        query = query.strip().rstrip(";")
        out = self.session(f"COPY ({query}) TO STDOUT;", uid=uid, role=role)
        for line in out.splitlines():
            line = line.strip()
            if not line or line.startswith(("RESET", "SET", "COPY ")):
                continue
            if line.startswith(("ERROR", "DETAIL", "HINT")) or set(line) <= {"-"}:
                continue
            return line
        return ""

    def session(self, statement: str, *, uid: str | None = None, role: str | None = None) -> str:
        """
        Run one statement in a self-contained session.

        Each psql invocation is a separate connection, so `SET ROLE` from an
        earlier call would be lost; the role and JWT claims are therefore set in
        the same script as the statement under test.
        """
        script = ["RESET ROLE;"]
        if role:
            # Use SET rather than SELECT set_config() so no result rows are
            # emitted into the output we have to parse.
            if uid:
                script.append(f"SET request.jwt.claim.sub = '{uid}';")
            script.append(f"SET request.jwt.claim.role = '{role}';")
            script.append(f"SET ROLE {role};")
        script.append(statement)
        return self.psql("\n".join(script))

    def denied(self, statement: str, *, uid: str | None = None, role: str | None = None) -> bool:
        """True when the statement is rejected by the database."""
        try:
            self.session(statement, uid=uid, role=role)
            return False
        except SqlError:
            return True

    # -- schema ----------------------------------------------------------
    def bootstrap_supabase(self) -> None:
        self.psql(BOOTSTRAP.read_text())

    def apply_migrations(self, *, verbose: bool = False) -> int:
        applied = 0
        for path in sorted(MIGRATIONS.glob("*.sql")):
            for index, statement in enumerate(split_statements(strip_comments(path.read_text())), 1):
                try:
                    self.psql(statement + ";")
                except SqlError as exc:
                    raise SqlError(f"{path.name} [statement {index}]\n{exc}") from exc
                applied += 1
                if verbose:
                    print(f"  ok   {path.name} [{index}]")
        return applied
