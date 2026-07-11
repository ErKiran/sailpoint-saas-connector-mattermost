import { connector } from './index'
import {
    Connector,
    RawResponse,
    ResponseType,
    StandardCommand,
    AssumeAwsRoleRequest,
    AssumeAwsRoleResponse,
} from '@sailpoint/connector-sdk'
import { PassThrough } from 'stream'

const mockConfig: any = {
    token: 'xxx123',
    baseUrl: 'https://mattermost.example.com',
}
process.env.CONNECTOR_CONFIG = Buffer.from(JSON.stringify(mockConfig)).toString('base64')

function mockFetch(body: unknown) {
    global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => body,
    })) as jest.Mock
}

function mockFetchForEntitlementList() {
    global.fetch = jest.fn(async (url: URL | RequestInfo, init?: RequestInit) => {
        const requestUrl = url instanceof URL ? url : new URL(url.toString())
        const method = init?.method ?? 'GET'

        if (requestUrl.pathname === '/api/v4/teams') {
            return jsonResponse([
                {
                    id: 'team-1',
                    create_at: 1,
                    update_at: 2,
                    delete_at: 0,
                    display_name: 'Core Team',
                    name: 'core',
                    description: '',
                    email: '',
                    type: 'O',
                    allowed_domains: '',
                    invite_id: '',
                    allow_open_invite: true,
                },
            ])
        }

        if (requestUrl.pathname === '/api/v4/teams/team-1') {
            return jsonResponse({
                id: 'team-1',
                create_at: 1,
                update_at: 2,
                delete_at: 0,
                display_name: 'Core Team',
                name: 'core',
                description: '',
                email: '',
                type: 'O',
                allowed_domains: '',
                invite_id: '',
                allow_open_invite: true,
            })
        }

        if (requestUrl.pathname === '/api/v4/teams/team-1/members' && method === 'GET') {
            return jsonResponse([
                {
                    team_id: 'team-1',
                    user_id: 'user-1',
                    roles: 'team_user',
                    delete_at: 0,
                    scheme_guest: false,
                    scheme_user: true,
                    scheme_admin: false,
                },
            ])
        }

        if (requestUrl.pathname === '/api/v4/teams/team-1/channels') {
            return jsonResponse([
                {
                    id: 'channel-1',
                    create_at: 10,
                    update_at: 20,
                    delete_at: 0,
                    team_id: 'team-1',
                    type: 'O',
                    display_name: 'Town Square',
                    name: 'town-square',
                    header: '',
                    purpose: '',
                    creator_id: 'user-1',
                    total_msg_count: 0,
                    extra_update_at: 0,
                },
            ])
        }

        if (requestUrl.pathname === '/api/v4/teams/team-1/channels/private') {
            return jsonResponse([])
        }

        if (requestUrl.pathname === '/api/v4/channels/channel-1') {
            return jsonResponse({
                id: 'channel-1',
                create_at: 10,
                update_at: 20,
                delete_at: 0,
                team_id: 'team-1',
                type: 'O',
                display_name: 'Town Square',
                name: 'town-square',
                header: '',
                purpose: '',
                creator_id: 'user-1',
                total_msg_count: 0,
                extra_update_at: 0,
            })
        }

        if (requestUrl.pathname === '/api/v4/channels/channel-1/members' && method === 'GET') {
            return jsonResponse([
                {
                    channel_id: 'channel-1',
                    user_id: 'user-1',
                    roles: 'channel_user',
                    last_viewed_at: 0,
                    msg_count: 0,
                    mention_count: 0,
                    last_update_at: 0,
                    scheme_guest: false,
                    scheme_user: true,
                    scheme_admin: false,
                },
            ])
        }

        return jsonResponse({ message: `No mock for ${requestUrl.pathname}` }, false, 404)
    }) as jest.Mock
}

function mockFetchForAccountUnlock() {
    global.fetch = jest.fn(async (url: URL | RequestInfo, init?: RequestInit) => {
        const requestUrl = url instanceof URL ? url : new URL(url.toString())

        if (requestUrl.pathname === '/api/v4/users/user-1/active' && init?.method === 'PUT') {
            return jsonResponse({ status: 'OK' })
        }

        if (requestUrl.pathname === '/api/v4/users/user-1') {
            return jsonResponse({
                id: 'user-1',
                create_at: 1,
                update_at: 2,
                delete_at: 0,
                username: 'ada',
                first_name: 'Ada',
                last_name: 'Lovelace',
                nickname: '',
                email: 'ada@example.com',
                email_verified: true,
                auth_service: '',
                roles: 'system_user',
                locale: 'en',
                position: '',
                last_password_update: 0,
                last_picture_update: 0,
                failed_attempts: 0,
                mfa_active: false,
            })
        }

        if (requestUrl.pathname === '/api/v4/teams') {
            return jsonResponse([])
        }

        return jsonResponse({ message: `No mock for ${requestUrl.pathname}` }, false, 404)
    }) as jest.Mock
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
        ok,
        status,
        json: async () => body,
    } as Response
}

describe('connector unit tests', () => {
    it('connector SDK major version should be the same as Connector.SDK_VERSION', async () => {
        expect((await connector()).sdkVersion).toStrictEqual(Connector.SDK_VERSION)
    })

    it('should execute stdTestConnectionHandler', async () => {
        mockFetch({ status: 'OK' })
        await (
            await connector()
        )._exec(
            StandardCommand.StdTestConnection,
            {
                reloadConfig() {
                    return Promise.resolve()
                },

                assumeAwsRole(assumeAwsRoleRequest: AssumeAwsRoleRequest): Promise<AssumeAwsRoleResponse> {
                    return Promise.resolve(
                        new AssumeAwsRoleResponse('accessKeyId', 'secretAccessKey', 'sessionToken', '123')
                    )
                },

                getOAuth2AccessToken() {
                    return Promise.resolve({} as any)
                },
            },
            undefined,
            new PassThrough({ objectMode: true }).on('data', (chunk) =>
                expect(chunk).toStrictEqual(new RawResponse({}, ResponseType.Output))
            )
        )
    })

    it('should execute stdEntitlementListHandler', async () => {
        mockFetchForEntitlementList()
        const chunks: RawResponse[] = []
        await (
            await connector()
        )._exec(
            StandardCommand.StdEntitlementList,
            {
                reloadConfig() {
                    return Promise.resolve()
                },

                assumeAwsRole(assumeAwsRoleRequest: AssumeAwsRoleRequest): Promise<AssumeAwsRoleResponse> {
                    return Promise.resolve(
                        new AssumeAwsRoleResponse('accessKeyId', 'secretAccessKey', 'sessionToken', '123')
                    )
                },

                getOAuth2AccessToken() {
                    return Promise.resolve({} as any)
                },
            },
            { type: 'channel' },
            new PassThrough({ objectMode: true }).on('data', (chunk) => chunks.push(chunk))
        )

        expect(chunks).toStrictEqual([
            new RawResponse(
                {
                    identity: 'Town Square',
                    uuid: 'channel:channel-1',
                    type: 'channel',
                    attributes: {
                        id: 'channel:channel-1',
                        name: 'Town Square',
                        displayName: 'Town Square',
                        type: 'channel',
                        description: 'Access to the Town Square channel',
                        teamId: 'team-1',
                        teamName: 'core',
                        teamDisplayName: 'Core Team',
                        channelId: 'channel-1',
                        roleName: null,
                        riskLevel: 'medium',
                        requestable: true,
                        purpose: '',
                        header: '',
                        createdAt: 10,
                        updatedAt: 20,
                        deletedAt: 0,
                        memberIds: ['user-1'],
                        adminIds: [],
                    },
                },
                ResponseType.Output
            ),
        ])
    })

    it('should execute stdEntitlementReadHandler', async () => {
        mockFetchForEntitlementList()
        const chunks: RawResponse[] = []
        await (
            await connector()
        )._exec(
            StandardCommand.StdEntitlementRead,
            {
                reloadConfig() {
                    return Promise.resolve()
                },

                assumeAwsRole(assumeAwsRoleRequest: AssumeAwsRoleRequest): Promise<AssumeAwsRoleResponse> {
                    return Promise.resolve(
                        new AssumeAwsRoleResponse('accessKeyId', 'secretAccessKey', 'sessionToken', '123')
                    )
                },

                getOAuth2AccessToken() {
                    return Promise.resolve({} as any)
                },
            },
            { identity: 'channel-1', key: { simple: { id: 'channel-1' } }, type: 'channel' },
            new PassThrough({ objectMode: true }).on('data', (chunk) => chunks.push(chunk))
        )

        expect(chunks).toStrictEqual([
            new RawResponse(
                {
                    identity: 'Town Square',
                    uuid: 'channel:channel-1',
                    type: 'channel',
                    attributes: {
                        id: 'channel:channel-1',
                        name: 'Town Square',
                        displayName: 'Town Square',
                        type: 'channel',
                        description: 'Access to the Town Square channel',
                        teamId: 'team-1',
                        teamName: 'core',
                        teamDisplayName: 'Core Team',
                        channelId: 'channel-1',
                        roleName: null,
                        riskLevel: 'medium',
                        requestable: true,
                        purpose: '',
                        header: '',
                        createdAt: 10,
                        updatedAt: 20,
                        deletedAt: 0,
                        memberIds: ['user-1'],
                        adminIds: [],
                    },
                },
                ResponseType.Output
            ),
        ])
    })

    it('should execute stdAccountUnlockHandler', async () => {
        mockFetchForAccountUnlock()
        const chunks: RawResponse[] = []
        await (
            await connector()
        )._exec(
            StandardCommand.StdAccountUnlock,
            {
                reloadConfig() {
                    return Promise.resolve()
                },

                assumeAwsRole(assumeAwsRoleRequest: AssumeAwsRoleRequest): Promise<AssumeAwsRoleResponse> {
                    return Promise.resolve(
                        new AssumeAwsRoleResponse('accessKeyId', 'secretAccessKey', 'sessionToken', '123')
                    )
                },

                getOAuth2AccessToken() {
                    return Promise.resolve({} as any)
                },
            },
            { identity: 'user-1', key: { simple: { id: 'user-1' } } },
            new PassThrough({ objectMode: true }).on('data', (chunk) => chunks.push(chunk))
        )

        expect(chunks[0]).toStrictEqual(
            new RawResponse(
                {
                    identity: 'user-1',
                    uuid: 'user-1',
                    disabled: false,
                    attributes: {
                        id: 'user-1',
                        firstName: 'Ada',
                        lastName: 'Lovelace',
                        createdAt: 1,
                        updatedAt: 2,
                        userName: 'ada',
                        position: '',
                        email: 'ada@example.com',
                        nickname: '',
                        emailVerified: true,
                        authService: '',
                        roles: 'system_user',
                        locale: 'en',
                        timeZone: null,
                        roleEntitlements: ['role:system_user'],
                        teams: [],
                        channels: [],
                        entitlements: ['role:system_user'],
                    },
                },
                ResponseType.Output
            )
        )
    })
})
