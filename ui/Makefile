# Makefile
#
# Quality gates for all environments.
# NOTE: "file-audit" checks files exist. "test" and "test-visual" run actual tests.
#       These are different things. Do not confuse them.
#
# Usage:
#   make lint            — ESLint + TypeScript check
#   make test            — all unit tests (Vitest)
#   make test-visual     — all visual comparison tests (Playwright pixel match ≥ 99%)
#   make file-audit      — check companion files exist + baseline PNG integrity
#   make gate            — full quality gate (lint + test + file-audit)
#   make gate-full       — everything including visual comparison (slow)
#   make check-component COMPONENT=RepositoryRow — single component file inventory

.PHONY: lint test test-visual file-audit gate gate-full check-component audit-baselines

# Standard quality gate — run before any commit
# Includes lint, unit tests, file inventory check, and threshold policy.
# Does NOT include visual comparison (that's slow and needs Playwright).
gate: lint test file-audit check-thresholds
	@echo "✅ Quality gate passed (lint + unit tests + file inventory + threshold policy)."

# Full gate including visual pixel comparison (slow, needs browser)
gate-full: gate test-visual
	@echo "✅ Full quality gate passed (including visual pixel comparison)."

# Lint + typecheck
lint:
	pnpm lint
	pnpm typecheck

# Unit tests (Vitest) — verifies logic, props, events
test:
	pnpm test:unit

# Visual comparison tests (Playwright) — pixel-matches screenshots against baselines
# This is the actual ≥ 99% similarity check. Requires browser.
test-visual:
	pnpm exec playwright test

# File inventory — checks that companion files EXIST.
# Does NOT run any tests. Does NOT evaluate pixel similarity.
file-audit: audit-baselines
	bash .claude/scripts/audit-component-tests.sh

# Threshold policy — ensures no test/manifest has relaxed thresholds (> 0.01).
# This is a SOURCE CODE scan, NOT test execution.
check-thresholds:
	bash .claude/scripts/enforce-visual-threshold.sh

# Validate baseline PNG files are structurally valid (not corrupt)
audit-baselines:
	@for dir in $$(find src -name '__baselines__' -type d 2>/dev/null); do \
		bash .claude/scripts/validate-baselines.sh "$$dir"; \
	done

# Check a single component's file inventory
# Usage: make check-component COMPONENT=RepositoryRow
check-component:
	@if [ -z "$(COMPONENT)" ]; then echo "Usage: make check-component COMPONENT=<name>"; exit 1; fi
	@echo "File inventory for $(COMPONENT):"
	@found=0; \
	for f in $$(find src -name "$(COMPONENT).tsx" -not -name "*.test.*" -not -name "*.spec.*" -not -path "*__fixtures__*"); do \
		found=1; \
		dir=$$(dirname "$$f"); \
		base=$(COMPONENT); \
		echo "  Component: $$f"; \
		[ -f "$$dir/$$base.test.tsx" ] && echo "  ✅ Unit test file" || echo "  ❌ Unit test file missing"; \
		[ -f "$$dir/$$base.visual.spec.ts" ] && echo "  ✅ Visual test file" || echo "  ❌ Visual test file missing"; \
		[ -f "$$dir/__fixtures__/$$base.fixture.ts" ] && echo "  ✅ Fixture file" || echo "  ❌ Fixture file missing"; \
		[ -f "$$dir/__baselines__/$$base.baseline.png" ] && echo "  ✅ Baseline PNG" || echo "  ❌ Baseline PNG missing"; \
		echo ""; \
		echo "  To run actual tests:"; \
		echo "    pnpm test:unit $$dir/$$base.test.tsx"; \
		echo "    pnpm exec playwright test $$dir/$$base.visual.spec.ts"; \
	done; \
	[ $$found -eq 0 ] && echo "  Component $(COMPONENT) not found."
