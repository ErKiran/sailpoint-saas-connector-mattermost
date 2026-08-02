import { toChannelEntitlement } from './mappers'
import { MattermostChannel, MattermostTeam } from './types'

const townSquareChannel: MattermostChannel = {
    id: 'channel-town-square',
    createAt: 10,
    updateAt: 20,
    deleteAt: 0,
    teamId: 'team-engineering',
    type: 'O',
    displayName: 'Town Square',
    name: 'town-square',
    header: '',
    purpose: '',
    creatorId: 'user-1',
    totalMessageCount: 0,
    extraUpdateAt: 0,
}

function team(id: string, name: string, displayName: string): MattermostTeam {
    return {
        id,
        createAt: 1,
        updateAt: 2,
        deleteAt: 0,
        displayName,
        name,
        description: '',
        email: '',
        type: 'O',
        allowedDomains: '',
        inviteId: '',
        allowOpenInvite: true,
    }
}

describe('Mattermost channel entitlement mapper', () => {
    it('adds team display name to duplicate channel display names without changing ids', () => {
        const entitlements = [
            toChannelEntitlement(
                { ...townSquareChannel, id: 'channel-engineering', teamId: 'team-engineering' },
                team('team-engineering', 'engineering', 'Engineering'),
                []
            ),
            toChannelEntitlement(
                { ...townSquareChannel, id: 'channel-finance', teamId: 'team-finance' },
                team('team-finance', 'finance', 'Finance'),
                []
            ),
            toChannelEntitlement(
                { ...townSquareChannel, id: 'channel-geeky', teamId: 'team-geeky' },
                team('team-geeky', 'geeky', 'geeky'),
                []
            ),
        ]

        expect(entitlements.map((entitlement) => entitlement.displayName)).toStrictEqual([
            'Engineering / Town Square',
            'Finance / Town Square',
            'geeky / Town Square',
        ])
        expect(entitlements.map((entitlement) => entitlement.id)).toStrictEqual([
            'channel:channel-engineering',
            'channel:channel-finance',
            'channel:channel-geeky',
        ])
        expect(entitlements.map((entitlement) => entitlement.channelId)).toStrictEqual([
            'channel-engineering',
            'channel-finance',
            'channel-geeky',
        ])
        expect(entitlements.map((entitlement) => entitlement.name)).toStrictEqual([
            'Town Square',
            'Town Square',
            'Town Square',
        ])
    })

    it('uses the channel display name when team display name is unavailable', () => {
        const entitlement = toChannelEntitlement(townSquareChannel, team('team-no-name', '', ''), [])

        expect(entitlement.displayName).toBe('Town Square')
    })
})
