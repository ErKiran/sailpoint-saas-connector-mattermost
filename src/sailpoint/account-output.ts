import { StdAccountListOutput } from '@sailpoint/connector-sdk'
import { MattermostUser } from '../mattermost/users/types'

export function toStdAccountOutput(account: MattermostUser): StdAccountListOutput {
    return {
        identity: account.id,
        uuid: account.id,
        disabled: account.deleteAt > 0,
        attributes: {
            id: account.id,
            firstName: account.firstName,
            lastName: account.lastName,
            createdAt: account.createAt,
            updatedAt: account.updateAt,
            userName: account.username,
            position: account.position,
            email: account.email,
            nickname: account.nickname,
            emailVerified: account.emailVerified,
            authService: account.authService,
            roles: account.roles,
            locale: account.locale,
            timeZone: account.timezone?.automaticTimezone || null,
            channels: account.channels ?? [],
        },
    }
}
