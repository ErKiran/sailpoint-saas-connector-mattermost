# Mattermost SailPoint SaaS Connector

This is a SailPoint SaaS connector for Mattermost.

The connector can aggregate Mattermost users, teams, channels, and roles. It also supports provisioning users from SailPoint to Mattermost, including assigning team and channel access.

I built this connector to make Mattermost access governable from SailPoint, same like other connectors where we can see accounts, filter users, review entitlements, and provision or revoke access.

## What This Connector Does

-   Connects to Mattermost using a bearer token and Mattermost base URL.
-   Tests connection with Mattermost system ping API.
-   Aggregates Mattermost users as SailPoint accounts.
-   Supports filtering users during account aggregation.
-   Aggregates Mattermost teams as entitlements.
-   Aggregates Mattermost channels as entitlements.
-   Aggregates Mattermost roles as entitlements.
-   Keeps separate entitlement-backed fields for `teams`, `channels`, and `roleEntitlements`.
-   Uses stable entitlement IDs as entitlement identity values, not friendly names.
-   Supports account create, update, delete, disable, enable, and unlock.
-   Supports adding and removing team/channel entitlements.
-   Supports setting system roles like `system_user` and `system_admin`.
-   Adds request logs for account create so we can see what SailPoint is passing.

## SailPoint Commands

These are the standard commands currently supported by the connector:

```text
std:test-connection
std:account:list
std:account:read
std:account:create
std:account:update
std:account:delete
std:account:disable
std:account:enable
std:account:unlock
std:entitlement:list
std:entitlement:read
```

## Configuration

The connector needs these values in source config:

| Field     | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `token`   | Mattermost personal access token or bot token                 |
| `baseUrl` | Mattermost base URL, example `https://mattermost.example.com` |

The token should have enough permission to read users, teams, channels, members, and to provision users.

## User Filters

The connector supports Mattermost user filters, so we do not need to always aggregate every user.

Available filter fields:

| Config Key         | Meaning                             |
| ------------------ | ----------------------------------- |
| `userActive`       | Aggregate active users only         |
| `userInactive`     | Aggregate inactive users only       |
| `userInTeam`       | Aggregate users in a team ID        |
| `userNotInTeam`    | Aggregate users not in a team ID    |
| `userInChannel`    | Aggregate users in a channel ID     |
| `userNotInChannel` | Aggregate users not in a channel ID |
| `userWithoutTeam`  | Aggregate users without any team    |
| `userRole`         | Filter by one system role           |
| `userRoles`        | Filter by multiple system roles     |
| `userTeamRoles`    | Filter by team roles                |
| `userChannelRoles` | Filter by channel roles             |
| `userSort`         | Sort users from Mattermost API      |

Note: `userActive` and `userInactive` cannot both be enabled together.

## Account Schema

The account schema includes normal Mattermost user fields and entitlement fields.

Main account fields:

```text
id
firstName
lastName
email
createdAt
updatedAt
userName
position
nickname
emailVerified
authService
roles
locale
timeZone
teams
channels
roleEntitlements
```

The connector uses:

```text
identityAttribute: email
displayAttribute: firstName
groupAttribute: teams
```

## Entitlements

The connector has three entitlement types.

### Team Entitlements

Mattermost team membership.

Example:

```text
team:team_id
```

Returned metadata:

```text
id
name
type
description
teamId
teamName
displayName
teamDisplayName
riskLevel
requestable
```

### Channel Entitlements

Mattermost channel membership.

Example:

```text
channel:channel_id
```

Returned metadata:

```text
id
name
displayName
type
description
teamId
teamName
teamDisplayName
channelId
riskLevel
requestable
purpose
header
createdAt
updatedAt
deletedAt
```

Private channels are marked higher risk than normal channels.

### Role Entitlements

Mattermost role or privilege level.

Examples:

```text
role:system_admin
role:system_user
role:team_admin
role:team_user
role:channel_admin
role:channel_user
role:guest
```

Admin roles are marked high or critical risk where possible.

## Provisioning Features

The connector supports create and update from SailPoint.

### Create Account

Create account supports these fields:

```text
email
userName
username
firstName
lastName
nickname
position
locale
password
authData
authService
roles
teams
channels
entitlements
```

`email` can also be inferred from SailPoint identity when it is not directly provided.

`userName` is used as Mattermost username. `username` is also accepted.

During create:

1. Connector creates the Mattermost user.
2. Connector adds team memberships first.
3. Connector adds channel memberships after team membership.
4. Connector applies unified create entitlements if provided in the create request.
5. Connector updates system roles if provided.

This is important because Mattermost does not allow adding user to a channel if the user is not already member of that channel team.

The connector can resolve team values by:

```text
team:<id>
raw team id
Mattermost team name
Mattermost team display name
```

So values like `Engineering` can work if that is the Mattermost team display name.

### Update Account

Update account supports:

-   Patch user profile fields.
-   Set system roles.
-   Add, remove, or set `teams`.
-   Add, remove, or set `channels`.
-   Add, remove, or set provisioning-only unified `entitlements` input.

### Disable, Enable, Unlock

These commands use Mattermost active status.

```text
std:account:disable -> active false
std:account:enable  -> active true
std:account:unlock  -> active true
```

### Delete Account

Delete account calls the Mattermost user delete API.

## Request Logs

For account create, the connector logs useful debugging data:

-   Raw SailPoint account create input.
-   Normalized Mattermost create input.
-   Mattermost create user payload.

Sensitive values are redacted:

```text
password
authData
auth_data
token
secret
```

This helps to recreate SailPoint create payload locally when provisioning is failing.

## Local Development Commands

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run tests in one process:

```bash
npm test -- --runInBand
```

Type check:

```bash
npx tsc --noEmit
```

Format all files:

```bash
npm run prettier
```

Build connector:

```bash
npm run build
```

Run connector locally with source maps:

```bash
npm run dev
```

Run connector with SPCX:

```bash
npm run debug
```

Package connector zip:

```bash
npm run pack-zip
```

Clean build output:

```bash
npm run clean
```

## Project Structure

The code is separated by feature area now, so the connector is not one big file.

```text
src/index.ts                         Connector command registration
src/mattermost.ts                    Main Mattermost client facade
src/mattermost/common                Shared HTTP client, helpers, and types
src/mattermost/users                 User/account code, payloads, filters, mappers
src/mattermost/channels              Team, channel, role entitlement code
src/sailpoint                        SailPoint output mapping, schema, request logging
src/my-client.spec.ts                Mattermost client tests
src/index.spec.ts                    Connector command tests
```

## Build And Upload Notes

Before uploading to SailPoint, run:

```bash
npx tsc --noEmit
npm test -- --runInBand
npm run build
```

Then package:

```bash
npm run pack-zip
```

Important note: `accountCreateTemplate` is not used in `connector-spec.json` because SailPoint connector specification validation rejected that property for this connector spec. Account fields are handled by the account schema and create input normalization.

## Current Limitation

`std:account:discover-schema` is not currently registered as a command in this codebase. The account schema is defined in `connector-spec.json` and mirrored in `src/sailpoint/account-schema.ts`.
