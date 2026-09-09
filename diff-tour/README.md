# `diff-tour`

Generates a link to the Diff Tour for a PR and posts it as a PR comment.

## Usage

```yaml
on: pull_request

permissions:
  pull-requests: write

steps:
  - uses: sourcegraph/actions/diff-tour@main
```

## Inputs

This action has no inputs.

## What it does

1. Builds a Diff Tour URL for the PR — a commit link if the PR is merged, or a branch compare link if it's still open
2. Creates a PR comment with the link, or updates the existing one if it has already posted a comment
