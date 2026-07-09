import { AttributeChange, ConnectorError } from '@sailpoint/connector-sdk'
import { removeEmptyValues } from '../common/helpers'
import { MattermostAccountAttributes, MattermostCreateUserRequest, MattermostPatchUserRequest } from './types'

export function toCreateUserRequest(attributes: MattermostAccountAttributes): MattermostCreateUserRequest {
    const email = attributes.email?.trim()
    const username = (attributes.userName ?? attributes.username)?.trim()

    if (!email) {
        throw new ConnectorError('email is required to create a Mattermost account')
    }

    if (!username) {
        throw new ConnectorError('userName is required to create a Mattermost account')
    }

    return removeEmptyValues({
        email,
        username,
        first_name: attributes.firstName,
        last_name: attributes.lastName,
        nickname: attributes.nickname,
        position: attributes.position,
        locale: attributes.locale,
        password: attributes.password,
        auth_data: attributes.authData,
        auth_service: attributes.authService,
    }) as MattermostCreateUserRequest
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
