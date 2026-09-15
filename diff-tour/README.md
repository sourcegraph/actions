# `diff-tour`

Generates a link to the Diff Tour for a PR and posts it as a PR comment.

## Usage

```yaml
on:
  pull_request:
    # `closed` fires on merge, so the comment is updated to link the merge commit
    types: [opened, synchronize, reopened, closed]

permissions:
  pull-requests: write

jobs:
  diff-tour:
    runs-on: ubuntu-latest
    # Diff Tour resolves branch names against the base repo, so skip fork PRs.
    # Closed PRs only need an update when they were merged.
    if: >
      github.event.pull_request.head.repo.full_name == github.repository
      && (github.event.action != 'closed' || github.event.pull_request.merged)
    steps:
      - uses: sourcegraph/actions/diff-tour@main
```

## Inputs

This action has no inputs.

## What it does

1. Builds a Diff Tour URL for the PR — a commit link if the PR is merged, or a branch compare link if it's still open
2. Creates a PR comment with the link, or updates the existing one if it has already posted a comment
