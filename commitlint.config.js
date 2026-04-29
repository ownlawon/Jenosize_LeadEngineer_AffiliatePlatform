/**
 * Conventional commits config — see https://www.conventionalcommits.org
 *
 * Allowed types: feat, fix, chore, docs, refactor, test, style, perf, ci, build, revert
 *
 * Examples:
 *   feat(api): add CSV export endpoint
 *   fix(web): correct CTR rounding when impressions > clicks
 *   chore(tier-1): hardening pass — hooks, security, logging
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow longer header lines so tier-summary commits read clearly.
    "header-max-length": [2, "always", 100],
    // Subject is sentence-case in this repo (engineer-style), not strict
    // lower-case. Don't fail commits for that.
    "subject-case": [0],
    // Body lines are wrapped to 80 cols by hand; don't gate on it.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
