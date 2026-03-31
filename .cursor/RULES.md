# Project Rules

## Author verification before push
Before any `git push` (especially when rewriting history), always verify the commit author matches the expected account.

Checklist:
- Verify local git config in this repo:
  - `git config user.name`
  - `git config user.email`
- Verify the last commit author:
  - `git log -1 --pretty=format:"%an <%ae>"`
- If author name is not `advayta108`, update `git config` locally (repo-scoped) before committing/pushing.

## No Cursor markers in commit messages
- Never include trailers like `Made-with: Cursor` in commit messages.
- When amending/creating commits, keep commit messages clean and only contain the intended subject/body.

## Publish workflow scope
- CI publish workflows must only publish from the intended branch/tag combinations. Do not expand triggers casually.

