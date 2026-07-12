import { logger, StdAccountCreateInput } from '@sailpoint/connector-sdk'
import { MattermostCreateAccountInput, MattermostCreateUserRequest } from '../mattermost/users/types'

const REDACTED = '[REDACTED]'
const SENSITIVE_KEYS = new Set(['password', 'authData', 'auth_data', 'token', 'secret'])

export function logStdAccountCreateInput(input: StdAccountCreateInput): void {
    logger.info(
        {
            identity: input.identity,
            attributeKeys: getObjectKeys(input.attributes),
            attributes: sanitize(input.attributes),
            attributesWithMetadata: sanitize(input.attributesWithMetadata),
            schema: input.schema
                ? {
                      displayAttribute: input.schema.displayAttribute,
                      identityAttribute: input.schema.identityAttribute,
                      groupAttribute: input.schema.groupAttribute,
                      attributeNames: input.schema.attributes.map((attribute) => attribute.name),
                  }
                : null,
        },
        'stdAccountCreate received SailPoint input'
    )
}

export function logMattermostCreateInput(input: MattermostCreateAccountInput): void {
    logger.info(
        {
            identity: input.identity,
            attributeKeys: getObjectKeys(input.attributes),
            attributes: sanitize(input.attributes),
        },
        'stdAccountCreate normalized Mattermost create input'
    )
}

export function logMattermostCreatePayload(payload: MattermostCreateUserRequest): void {
    logger.info(
        {
            payload: sanitize(payload),
        },
        'stdAccountCreate Mattermost create user payload'
    )
}

function sanitize(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => sanitize(item))
    }

    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [
                key,
                SENSITIVE_KEYS.has(key) ? REDACTED : sanitize(nestedValue),
            ])
        )
    }

    return value
}

function getObjectKeys(value: unknown): string[] {
    return isRecord(value) ? Object.keys(value) : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}
