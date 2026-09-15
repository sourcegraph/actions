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

## What it does

1. Installs Go using the version from your `go.mod`
2. Configures git to access private `github.com/sourcegraph/*` repos
3. Sets `GOPRIVATE` and `GOPROXY` environment variables
