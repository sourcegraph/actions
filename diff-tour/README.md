# `diff-tour`

Generates a link to the Diff Tour for a PR and posts it as a PR comment.

## Usage

```yaml
on:
  pull_request:
    # `edited` fires when the base branch changes; `synchronize` does not.
    # `closed` fires on merge and on plain close; either way the comment is
    # updated to a link that survives deleting the head branch.
    types: [closed, edited, opened, reopened, synchronize]

# The only permission needed. The action does not check out your repo, so
# `contents: read` is not required, even for private repos.
permissions:
  pull-requests: write

jobs:
  diff-tour:
    runs-on: ubuntu-latest
    # Diff Tour resolves branch names against the base repo, so skip fork PRs.
    if: github.event.pull_request.head.repo.full_name == github.repository
    steps:
      - uses: sourcegraph/actions/diff-tour@main
```

## Inputs

This action has no inputs.

## What it does

1. Builds a Diff Tour URL for the PR: a `base...head` compare link by branch
   name while open, by head commit SHA once closed without merging, or a
   merge-commit link once merged. The repo must be indexed on
   sourcegraph.sourcegraph.com as `<github host>/<owner>/<repo>`
2. Creates a PR comment with the link, or updates the existing one if it has
   already posted a comment
