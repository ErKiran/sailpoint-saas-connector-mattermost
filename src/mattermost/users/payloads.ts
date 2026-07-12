import { AttributeChange, ConnectorError, StdAccountCreateInput } from '@sailpoint/connector-sdk'
import { removeEmptyValues } from '../common/helpers'
import {
    MattermostAccountAttributes,
    MattermostCreateAccountInput,
    MattermostCreateUserRequest,
    MattermostPatchUserRequest,
} from './types'

export function toMattermostCreateAccountInput(input: StdAccountCreateInput): MattermostCreateAccountInput {
    return {
        identity: input.identity,
        attributes: toMattermostAccountAttributes(input.attributes),
    }
}

export function toCreateUserRequest(input: MattermostCreateAccountInput): MattermostCreateUserRequest {
    const email = input.attributes.email?.trim() || inferEmail(input.identity)
    const username = (input.attributes.userName ?? input.attributes.username)?.trim() || inferUsername(input.identity)

    if (!email) {
        throw new ConnectorError('email is required to create a Mattermost account')
    }

    if (!username) {
        throw new ConnectorError('userName is required to create a Mattermost account')
    }

    return removeEmptyValues({
        email,
        username,
        first_name: input.attributes.firstName,
        last_name: input.attributes.lastName,
        nickname: input.attributes.nickname,
        position: input.attributes.position,
        locale: input.attributes.locale,
        password: input.attributes.password,
        auth_data: input.attributes.authData,
        auth_service: input.attributes.authService,
    }) as MattermostCreateUserRequest
}

function toMattermostAccountAttributes(attributes: unknown): MattermostAccountAttributes {
    if (!isRecord(attributes)) {
        throw new ConnectorError('account create attributes must be an object')
    }

    return {
        id: getString(attributes, 'id'),
        email: getString(attributes, 'email'),
        userName: getString(attributes, 'userName'),
        username: getString(attributes, 'username'),
        firstName: getString(attributes, 'firstName'),
        lastName: getString(attributes, 'lastName'),
        nickname: getString(attributes, 'nickname'),
        position: getString(attributes, 'position'),
        locale: getString(attributes, 'locale'),
        password: getString(attributes, 'password'),
        authData: getString(attributes, 'authData'),
        authService: getString(attributes, 'authService'),
        roles: getString(attributes, 'roles'),
        teams: getStringArray(attributes, 'teams'),
        channels: getStringArray(attributes, 'channels'),
        entitlements: getStringArray(attributes, 'entitlements'),
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(attributes: Record<string, unknown>, key: string): string | undefined {
    const value = attributes[key]

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }

    return undefined
}

function getStringArray(attributes: Record<string, unknown>, key: string): string[] | undefined {
    const value = attributes[key]

    if (Array.isArray(value)) {
        return value.map(String).filter(Boolean)
    }

    if (typeof value === 'string' && value) {
        return [value]
    }

    return undefined
}

function inferEmail(identity?: string): string | undefined {
    return identity?.includes('@') ? identity : undefined
}

function inferUsername(identity?: string): string | undefined {
    if (!identity) {
        return undefined
    }

    return identity.includes('@') ? identity.split('@')[0] : identity
}

export function applyPatchChange(patch: MattermostPatchUserRequest, change: AttributeChange): void {
    const value = change.value === null || change.value === undefined ? '' : String(change.value)

    if (change.attribute === 'email') {
        patch.email = value
    } else if (change.attribute === 'userName' || change.attribute === 'username') {
        patch.username = value
    } else if (change.attribute === 'firstName') {
        patch.first_name = value
    } else if (change.attribute === 'lastName') {
        patch.last_name = value
    } else if (change.attribute === 'nickname') {
        patch.nickname = value
    } else if (change.attribute === 'position') {
        patch.position = value
    } else if (change.attribute === 'locale') {
        patch.locale = value
    }
}
