# Repository Guidelines

## Project Structure & Module Organization
As of October 23, 2025 the repository is an empty scaffold; start every feature by creating the shared layout below so new agents stay discoverable:
```
src/
  agents/
  common/
tests/
integration/
scripts/
docs/
assets/
```
Keep runtime logic in `src/agents/<feature_name>` with a module-level entrypoint named `run`. Shared helpers belong in `src/common`. Place smoke data under `assets/<feature>` and ensure every new directory contains an `__init__.py` (or equivalent index) so imports remain explicit.

## Build, Test, and Development Commands
Standardise automation through a top-level `Makefile` or `justfile`. Add these targets once tooling lands:
- `make install` — create `.venv` with Python 3.11 and install dependencies from `requirements.txt` or `pyproject.toml`.
- `make test` — execute unit and integration suites (`pytest tests integration`).
- `make lint` — run formatters (`black`) and static checks (`ruff --fix`).
- `make dev` — launch your preferred watcher (e.g., `scripts/dev.sh`) that reloads agents when files under `src/` change.
Document any additional command in `docs/commands.md` so future contributors can follow the same workflow.

## Coding Style & Naming Conventions
Use 4-space indentation and type hints on all public functions. Format with `black` (line length 100) and lint with `ruff`; add pre-commit hooks to enforce both before commits land. Modules use snake_case (`src/agents/session_tracker.py`), classes are PascalCase, and async coroutines start with `async_`. Keep agent configuration JSON or YAML names aligned with their module (e.g., `session_tracker.yaml`).

## Testing Guidelines
Write unit tests under `tests/` mirroring the module path (`tests/agents/test_session_tracker.py`). Place slower workflows in `integration/` and mark them with `@pytest.mark.integration`. Target ≥85% coverage for new code and fail builds when coverage regresses (`pytest --cov=src --cov-fail-under=85`). Stub external APIs with fixtures in `tests/fixtures/` to avoid network calls.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) and keep subject lines ≤72 characters. Squash work-in-progress commits locally before opening a PR. Every PR needs: a concise summary of behaviour change, a checklist of tests run, links to tracked issues, and screenshots or logs for user-facing updates. Request review from another contributor before merge, and wait for green CI on install, lint, and test targets.

## Configuration & Secrets
Share environment defaults via `.env.example` and never commit actual secrets. When adding new configuration keys, describe them in `docs/configuration.md` and gate their usage behind helper functions in `src/common/config.py` so agents fail fast with informative errors.
