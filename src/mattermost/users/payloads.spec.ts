import { ConnectorError } from '@sailpoint/connector-sdk'
import { toCreateUserRequest, toMattermostCreateAccountInput } from './payloads'

describe('Mattermost user create payload helpers', () => {
    it('normalizes SailPoint create attributes into a typed Mattermost create input', () => {
        const createInput = toMattermostCreateAccountInput({
            identity: 'grace@example.com',
            attributes: {
                email: 'ada@example.com',
                userName: 'ada',
                firstName: 'Ada',
                lastName: 'Lovelace',
                password: 'temporary-password',
                teams: 'team:team-1',
                channels: ['channel:channel-1'],
                entitlements: ['role:system_user'],
                locale: 123,
                authService: true,
            },
        })

        expect(createInput).toStrictEqual({
            identity: 'grace@example.com',
            attributes: {
                id: undefined,
                email: 'ada@example.com',
                userName: 'ada',
                username: undefined,
                firstName: 'Ada',
                lastName: 'Lovelace',
                nickname: undefined,
                position: undefined,
                locale: '123',
                password: 'temporary-password',
                authData: undefined,
                authService: 'true',
                roles: undefined,
                teams: ['team:team-1'],
                channels: ['channel:channel-1'],
                entitlements: ['role:system_user'],
            },
        })
    })

    it('infers create request email and username from identity', () => {
        const createInput = toMattermostCreateAccountInput({
            identity: 'grace@example.com',
            attributes: {},
        })

        expect(toCreateUserRequest(createInput)).toStrictEqual({
            email: 'grace@example.com',
            username: 'grace',
        })
    })

    it('rejects non-object create attributes', () => {
        expect(() =>
            toMattermostCreateAccountInput({
                attributes: null,
            })
        ).toThrow(ConnectorError)
    })

    it('requires an email when identity is not an email address', () => {
        const createInput = toMattermostCreateAccountInput({
            identity: 'grace',
            attributes: {},
        })

        expect(() => toCreateUserRequest(createInput)).toThrow(ConnectorError)
    })
})
