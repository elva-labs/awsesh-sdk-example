# @awsesh/core Test Repository

Test repository for the `@awsesh/core` SDK beta release.

## Setup

```bash
bun install
```

## Usage

### Initialize and check SDK

```bash
bun run start
```

### List saved sessions

```bash
bun run list-sessions
```

### Login to SSO

```bash
bun run login
```

### List accounts

```bash
bun run list-accounts
bun run list-accounts --refresh  # Force refresh from AWS
```

### Get credentials

```bash
bun run get-credentials <account-id> <role-name> [profile-name]

# Examples:
bun run get-credentials 123456789012 AdministratorAccess
bun run get-credentials 123456789012 AdministratorAccess my-profile
```

## SDK Version

Using `@awsesh/core@1.0.0-beta.202605041018`
