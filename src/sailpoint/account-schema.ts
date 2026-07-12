import { AccountSchema } from '@sailpoint/connector-sdk'

export const mattermostAccountSchema: AccountSchema = {
    displayAttribute: 'firstName',
    identityAttribute: 'email',
    groupAttribute: 'entitlements',
    attributes: [
        {
            name: 'id',
            type: 'string',
            description: 'Mattermost user ID',
        },
        {
            name: 'firstName',
            type: 'string',
            description: 'First name of the account',
        },
        {
            name: 'lastName',
            type: 'string',
            description: 'Last name of the account',
        },
        {
            name: 'email',
            type: 'string',
            description: 'Email of the account',
            required: true,
        },
        {
            name: 'createdAt',
            type: 'string',
            description: 'Account creation timestamp',
        },
        {
            name: 'updatedAt',
            type: 'string',
            description: 'Account last updated timestamp',
        },
        {
            name: 'userName',
            type: 'string',
            description: 'Username of the account',
            required: true,
        },
        {
            name: 'position',
            type: 'string',
            description: 'Position or job title of the account',
        },
        {
            name: 'nickname',
            type: 'string',
            description: 'Nickname of the account',
        },
        {
            name: 'emailVerified',
            type: 'boolean',
            description: 'Indicates whether the account email is verified',
        },
        {
            name: 'authService',
            type: 'string',
            description: 'Mattermost authentication service',
        },
        {
            name: 'roles',
            type: 'string',
            description: 'Raw Mattermost system roles assigned to the account',
        },
        {
            name: 'roleEntitlements',
            type: 'string',
            description: 'Mattermost role entitlements assigned to the account',
            multi: true,
            entitlement: true,
            managed: true,
            schemaObjectType: 'role',
        },
        {
            name: 'locale',
            type: 'string',
            description: 'Locale configured for the account',
        },
        {
            name: 'timeZone',
            type: 'string',
            description: 'Timezone configured for the account',
        },
        {
            name: 'teams',
            type: 'string',
            description: 'Mattermost team memberships assigned to the account',
            multi: true,
            entitlement: true,
            managed: true,
            schemaObjectType: 'team',
        },
        {
            name: 'channels',
            type: 'string',
            description: 'Mattermost channel memberships assigned to the account',
            multi: true,
            entitlement: true,
            managed: true,
            schemaObjectType: 'channel',
        },
        {
            name: 'entitlements',
            type: 'string',
            description: 'All normalized Mattermost team, channel, and role entitlements assigned to the account',
            multi: true,
        },
        {
            name: 'password',
            type: 'string',
            description: 'Password used only for account creation when Mattermost local authentication is used',
        },
        {
            name: 'authData',
            type: 'string',
            description: 'External authentication data used only for account creation',
        },
    ],
}
