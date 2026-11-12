# `go-setup`

Sets up Go with private Sourcegraph repository access.

## Usage

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: sourcegraph/actions/go-setup@main
    with:
      private-token: ${{ secrets.PRIVATE_SG_ACCESS_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `private-token` | Yes | - | Token for accessing private Sourcegraph repos |
| `go-version-file` | No | `go.mod` | Path to go.mod or go.work file to determine Go version |
| `cache` | No | `true` | Use `actions/setup-go`'s built-in module and build cache |
| `cache-dependency-path` | No | `go.sum` | Glob(s) whose hash forms the cache key, one per line |

## What it does

1. Installs Go using the version from your `go.mod`
2. Configures git to access private `github.com/sourcegraph/*` repos
3. Sets `GOPRIVATE` and `GOPROXY` environment variables
4. Restores and saves the Go module and build caches

## Caching

The built-in cache keys on OS, architecture, Go version, and the hash of
`cache-dependency-path`. There is no fallback key, and a job that restores a
cache never re-saves it. That is fine for one Go job per OS. With several Go
jobs on the same OS (lint, test, release), they all share one key and the
first job to finish decides what the rest restore. Those workflows should set
`cache: false` and run `actions/cache` themselves with a per-job key and
`restore-keys`:

```yaml
steps:
  - uses: sourcegraph/actions/go-setup@main
    with:
      cache: false
  - id: go-cache
    shell: bash
    run: |
      echo "build=$(go env GOCACHE)" >> "$GITHUB_OUTPUT"
      echo "modules=$(go env GOMODCACHE)" >> "$GITHUB_OUTPUT"
  - uses: actions/cache@v6
    with:
      path: |
        ${{ steps.go-cache.outputs.modules }}
        ${{ steps.go-cache.outputs.build }}
      key: ${{ github.job }}-${{ runner.os }}-${{ hashFiles('**/go.sum') }}
      restore-keys: |
        ${{ github.job }}-${{ runner.os }}-
```
