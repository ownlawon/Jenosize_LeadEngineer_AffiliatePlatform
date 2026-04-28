<!-- A short, decision-flavoured PR description beats a feature list. -->

## Summary

<!-- 1–3 sentences. What changed, and why now? -->

## Trade-offs / non-obvious choices

<!-- Anything a reviewer might wonder "why?" about — link an ADR if relevant. -->

## Test plan

- [ ] `pnpm -r typecheck` clean
- [ ] `pnpm -r test` clean
- [ ] `pnpm --filter @jenosize/api test:e2e` clean (when redirect/auth touched)
- [ ] Manual smoke against the live deploy (or the relevant `docs/UAT.md` cases)
- [ ] Screenshots / Loom for UI changes

## Risk

- [ ] Migrations included
- [ ] Backward-compatible API contract (or new `Paginated<T>` envelope etc. documented)
- [ ] Rate limits / auth surface unchanged (or intentionally adjusted with rationale)

## Out of scope

<!-- Explicit "we are not doing X here" — keeps reviewers from going on tangents. -->
