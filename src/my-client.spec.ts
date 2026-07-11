import { AttributeChangeOp, ConnectorError, SimpleKey } from '@sailpoint/connector-sdk'
import { MattermostClient } from './mattermost'

const mockConfig = {
    token: 'xxx123',
    baseUrl: 'https://mattermost.example.com',
}

const userResponse = {
    id: 'user-1',
    create_at: 1,
    update_at: 2,
    delete_at: 0,
    username: 'ada',
    first_name: 'Ada',
    last_name: 'Lovelace',
    nickname: 'ada',
    email: 'ada@example.com',
    email_verified: true,
    auth_service: '',
    roles: 'system_user',
    locale: 'en',
    position: 'Engineer',
    last_password_update: 3,
    last_picture_update: 4,
    failed_attempts: 0,
    mfa_active: false,
    timezone: {
        automaticTimezone: 'America/Chicago',
    },
}

const teamResponse = {
    id: 'team-1',
    create_at: 1,
    update_at: 2,
    delete_at: 0,
    display_name: 'Core Team',
    name: 'core',
    description: 'Core team',
    email: '',
    type: 'O',
    allowed_domains: '',
    invite_id: 'invite-1',
    allow_open_invite: true,
}

const teamMemberResponse = {
    team_id: 'team-1',
    user_id: 'user-1',
    roles: 'team_user team_admin',
    delete_at: 0,
    scheme_guest: false,
    scheme_user: true,
    scheme_admin: true,
}

const publicChannelResponse = {
    id: 'channel-1',
    create_at: 10,
    update_at: 20,
    delete_at: 0,
    team_id: 'team-1',
    type: 'O',
    display_name: 'Town Square',
    name: 'town-square',
    header: 'Announcements',
    purpose: 'General communication',
    creator_id: 'user-1',
    total_msg_count: 30,
    extra_update_at: 40,
}

const privateChannelResponse = {
    ...publicChannelResponse,
    id: 'channel-2',
    type: 'P',
    display_name: 'Leadership',
    name: 'leadership',
}

const channelMemberResponse = {
    channel_id: 'channel-1',
    user_id: 'user-1',
    roles: 'channel_user channel_admin',
    last_viewed_at: 50,
    msg_count: 60,
    mention_count: 0,
    last_update_at: 70,
    scheme_guest: false,
    scheme_user: true,
    scheme_admin: true,
}

function mockFetchWithMattermostResponses() {
    global.fetch = jest.fn(async (url: URL | RequestInfo, init?: RequestInit) => {
        const requestUrl = url instanceof URL ? url : new URL(url.toString())
        const path = requestUrl.pathname
        const method = init?.method ?? 'GET'

        if (path === '/api/v4/system/ping') {
            return jsonResponse({ status: 'OK' })
        }

        if (path === '/api/v4/users' && method === 'GET') {
            return jsonResponse([userResponse])
        }

        if (path === '/api/v4/users' && method === 'POST') {
            return jsonResponse(userResponse, true, 201)
        }

        if (path === '/api/v4/users/user-1') {
            return jsonResponse(userResponse)
        }

        if (path === '/api/v4/users/user-1/patch' && method === 'PUT') {
            return jsonResponse({ ...userResponse, first_name: 'Augusta' })
        }

        if (path === '/api/v4/users/user-1/roles' && method === 'PUT') {
            return jsonResponse({ status: 'OK' })
        }

        if (path === '/api/v4/users/user-1/active' && method === 'PUT') {
            return jsonResponse({ status: 'OK' })
        }

        if (path === '/api/v4/users/user-1' && method === 'DELETE') {
            return jsonResponse({ status: 'OK' })
        }

        if (path === '/api/v4/teams') {
            return jsonResponse([teamResponse])
        }

        if (path === '/api/v4/teams/team-1') {
            return jsonResponse(teamResponse)
        }

        if (path === '/api/v4/teams/team-1/members' && method === 'GET') {
            return jsonResponse([teamMemberResponse])
        }

        if (path === '/api/v4/teams/team-1/members' && method === 'POST') {
            return jsonResponse(teamMemberResponse, true, 201)
        }

        if (path === '/api/v4/teams/team-1/members/user-1' && method === 'DELETE') {
            return jsonResponse({ status: 'OK' })
        }

        if (path === '/api/v4/teams/team-1/channels') {
            return jsonResponse([publicChannelResponse])
        }

        if (path === '/api/v4/teams/team-1/channels/private') {
            return jsonResponse([privateChannelResponse])
        }

        if (path === '/api/v4/channels/channel-1') {
            return jsonResponse(publicChannelResponse)
        }

        if (path === '/api/v4/channels/channel-1/members' && method === 'GET') {
            return jsonResponse([channelMemberResponse])
        }

        if (path === '/api/v4/channels/channel-2/members' && method === 'GET') {
            return jsonResponse([{ ...channelMemberResponse, channel_id: 'channel-2' }])
        }

        if (path === '/api/v4/channels/channel-1/members' && method === 'POST') {
            return jsonResponse(channelMemberResponse, true, 201)
        }

        if (path === '/api/v4/channels/channel-2/members/user-1' && method === 'DELETE') {
            return jsonResponse({ status: 'OK' })
        }

        return jsonResponse({ message: `No mock for ${path}` }, false, 404)
    }) as jest.Mock
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
        ok,
        status,
        json: async () => body,
    } as Response
}

describe('connector client unit tests', () => {
    beforeEach(() => {
        mockFetchWithMattermostResponses()
    })

    it('lists accounts with channel entitlement memberships', async () => {
        const client = new MattermostClient(mockConfig)

        const allAccounts = await client.getAllAccounts()

        expect(allAccounts).toHaveLength(1)
        expect(allAccounts[0]).toMatchObject({
            id: 'user-1',
            username: 'ada',
            teams: ['team:team-1'],
            channels: ['channel:channel-1', 'channel:channel-2'],
            roleEntitlements: [
                'role:system_user',
                'role:team_admin',
                'role:team_user',
                'role:channel_admin',
                'role:channel_user',
            ],
            entitlements: [
                'team:team-1',
                'channel:channel-1',
                'channel:channel-2',
                'role:system_user',
                'role:team_admin',
                'role:team_user',
                'role:channel_admin',
                'role:channel_user',
            ],
        })
    })

    it('passes configured user filters to the Mattermost users endpoint', async () => {
        const client = new MattermostClient({
            ...mockConfig,
            userActive: true,
            userInTeam: 'team-1',
            userRoles: 'system_admin, system_user',
            userTeamRoles: 'team_user',
            userSort: 'create_at',
        })

        await client.getAllAccounts()

        const fetchMock = global.fetch as jest.Mock
        const usersRequest = fetchMock.mock.calls
            .map(([url]) => (url instanceof URL ? url : new URL(url.toString())))
            .find((url) => url.pathname === '/api/v4/users')

        expect(usersRequest?.searchParams.get('active')).toBe('true')
        expect(usersRequest?.searchParams.get('in_team')).toBe('team-1')
        expect(usersRequest?.searchParams.get('roles')).toBe('system_admin,system_user')
        expect(usersRequest?.searchParams.get('team_roles')).toBe('team_user')
        expect(usersRequest?.searchParams.get('sort')).toBe('create_at')
    })

    it('lists Mattermost channels as entitlements', async () => {
        const client = new MattermostClient(mockConfig)

        const entitlements = await client.getAllChannelEntitlements()

        expect(entitlements).toHaveLength(2)
        expect(entitlements[0]).toMatchObject({
            id: 'channel:channel-1',
            name: 'Town Square',
            displayName: 'Town Square',
            type: 'channel',
            teamId: 'team-1',
            teamName: 'core',
            channelId: 'channel-1',
            riskLevel: 'medium',
            memberIds: ['user-1'],
            adminIds: ['user-1'],
        })
    })

    it('lists teams, channels, and roles as entitlements', async () => {
        const client = new MattermostClient(mockConfig)

        const entitlements = await client.getAllEntitlements()

        expect(entitlements.map((entitlement) => entitlement.id)).toEqual(
            expect.arrayContaining(['team:team-1', 'channel:channel-1', 'role:system_admin', 'role:system_user'])
        )
    })

    it('reads a single Mattermost channel entitlement', async () => {
        const client = new MattermostClient(mockConfig)

        const entitlement = await client.getChannelEntitlement('channel-1')

        expect(entitlement).toMatchObject({
            id: 'channel:channel-1',
            name: 'Town Square',
            displayName: 'Town Square',
            type: 'channel',
            teamId: 'team-1',
            teamName: 'core',
            channelId: 'channel-1',
            memberIds: ['user-1'],
        })
    })

    it('creates a Mattermost account and assigns requested channels', async () => {
        const client = new MattermostClient(mockConfig)

        await client.createAccount({
            attributes: {
                email: 'ada@example.com',
                userName: 'ada',
                firstName: 'Ada',
                lastName: 'Lovelace',
                password: 'temporary-password',
                channels: ['channel-1'],
            },
        })

        const fetchMock = global.fetch as jest.Mock
        const createCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/users' && init?.method === 'POST'
        })
        const addChannelCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/channels/channel-1/members' && init?.method === 'POST'
        })

        expect(JSON.parse(createCall?.[1]?.body as string)).toMatchObject({
            email: 'ada@example.com',
            username: 'ada',
            first_name: 'Ada',
            last_name: 'Lovelace',
            password: 'temporary-password',
        })
        expect(JSON.parse(addChannelCall?.[1]?.body as string)).toStrictEqual({ user_id: 'user-1' })
    })

    it('updates account attributes, roles, and channel memberships', async () => {
        const client = new MattermostClient(mockConfig)

        await client.updateAccount({
            identity: 'user-1',
            key: SimpleKey('user-1'),
            changes: [
                {
                    op: AttributeChangeOp.Set,
                    attribute: 'firstName',
                    value: 'Augusta',
                },
                {
                    op: AttributeChangeOp.Set,
                    attribute: 'roles',
                    value: 'system_user system_admin',
                },
                {
                    op: AttributeChangeOp.Add,
                    attribute: 'channels',
                    value: 'channel-1',
                },
                {
                    op: AttributeChangeOp.Remove,
                    attribute: 'channels',
                    value: 'channel-2',
                },
            ],
        })

        const fetchMock = global.fetch as jest.Mock
        const patchCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/users/user-1/patch' && init?.method === 'PUT'
        })
        const rolesCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/users/user-1/roles' && init?.method === 'PUT'
        })
        const removeChannelCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/channels/channel-2/members/user-1' && init?.method === 'DELETE'
        })

        expect(JSON.parse(patchCall?.[1]?.body as string)).toStrictEqual({ first_name: 'Augusta' })
        expect(JSON.parse(rolesCall?.[1]?.body as string)).toStrictEqual({ roles: 'system_user system_admin' })
        expect(removeChannelCall).toBeDefined()
    })

    it('deletes, disables, and enables Mattermost accounts', async () => {
        const client = new MattermostClient(mockConfig)

        await client.deleteAccount('user-1')
        await client.setAccountActive('user-1', false)
        await client.setAccountActive('user-1', true)

        const fetchMock = global.fetch as jest.Mock
        const deleteCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/users/user-1' && init?.method === 'DELETE'
        })
        const activeCalls = fetchMock.mock.calls.filter(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/users/user-1/active' && init?.method === 'PUT'
        })

        expect(deleteCall).toBeDefined()
        expect(activeCalls.map(([, init]) => JSON.parse(init?.body as string))).toStrictEqual([
            { active: false },
            { active: true },
        ])
    })

    it('unlocks Mattermost accounts by setting them active', async () => {
        const client = new MattermostClient(mockConfig)

        await client.unlockAccount('user-1')

        const fetchMock = global.fetch as jest.Mock
        const unlockCall = fetchMock.mock.calls.find(([url, init]) => {
            const requestUrl = url instanceof URL ? url : new URL(url.toString())
            return requestUrl.pathname === '/api/v4/users/user-1/active' && init?.method === 'PUT'
        })

        expect(JSON.parse(unlockCall?.[1]?.body as string)).toStrictEqual({ active: true })
    })

    it('tests the connection', async () => {
        const client = new MattermostClient(mockConfig)

        expect(await client.testConnection()).toStrictEqual({})
    })

    it('requires token and baseUrl', async () => {
        expect(() => new MattermostClient({})).toThrow(ConnectorError)
        expect(() => new MattermostClient({ token: 'xxx123' })).toThrow(ConnectorError)
        expect(() => new MattermostClient({ baseUrl: 'https://mattermost.example.com' })).toThrow(ConnectorError)
    })

    it('rejects conflicting active and inactive user filters', async () => {
        expect(
            () =>
                new MattermostClient({
                    ...mockConfig,
                    userActive: true,
                    userInactive: true,
                })
        ).toThrow(ConnectorError)
    })
})
