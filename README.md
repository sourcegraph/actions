# Sourcegraph Actions

Reusable GitHub Actions for Sourcegraph repositories.

## Available Actions

| Action | Description |
|--------|-------------|
| [go-setup](./go-setup) | Setup Go with private Sourcegraph repository access |

## Usage

Reference actions using `sourcegraph/actions/<action>@main`:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: sourcegraph/actions/go-setup@main
    with:
      private-token: ${{ secrets.PRIVATE_SG_ACCESS_TOKEN }}
```

See each action's README for detailed usage and inputs.
