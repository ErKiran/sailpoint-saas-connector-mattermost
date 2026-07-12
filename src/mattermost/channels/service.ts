import { ConnectorError } from '@sailpoint/connector-sdk'
import { MattermostHttpClient } from '../common/http-client'
import {
    ROLE_DEFINITIONS,
    mapMattermostChannelMemberResponse,
    mapMattermostChannelResponse,
    mapMattermostTeamMemberResponse,
    mapMattermostTeamResponse,
    stripEntitlementPrefix,
    toChannelEntitlement,
    toRoleEntitlement,
    toTeamEntitlement,
} from './mappers'
import {
    MattermostChannel,
    MattermostChannelEntitlement,
    MattermostChannelMember,
    MattermostEntitlement,
    MattermostTeam,
    MattermostTeamMember,
} from './types'

const LIST_TEAMS = '/api/v4/teams'

export class MattermostChannelService {
    constructor(private readonly http: MattermostHttpClient) {}

    async getAllEntitlements(): Promise<MattermostEntitlement[]> {
        return [
            ...(await this.getAllTeamEntitlements()),
            ...(await this.getAllChannelEntitlements()),
            ...this.getRoleEntitlements(),
        ]
    }

    async getEntitlement(type: string, entitlementId: string): Promise<MattermostEntitlement> {
        if (type === 'team') {
            return this.getTeamEntitlement(stripEntitlementPrefix(entitlementId, 'team'))
        }

        if (type === 'channel') {
            return this.getChannelEntitlement(stripEntitlementPrefix(entitlementId, 'channel'))
        }

        if (type === 'role') {
            return this.getRoleEntitlement(stripEntitlementPrefix(entitlementId, 'role'))
        }

        throw new Error(`Unsupported entitlement type ${type}`)
    }

    async getAllTeamEntitlements(): Promise<MattermostEntitlement[]> {
        const teams = await this.getAllTeams()
        const entitlements: MattermostEntitlement[] = []

        for (const team of teams) {
            entitlements.push(toTeamEntitlement(team, await this.getAllTeamMembers(team.id)))
        }

        return entitlements
    }

    async getTeamEntitlement(teamId: string): Promise<MattermostEntitlement> {
        const team = mapMattermostTeamResponse(await this.http.request(`/api/v4/teams/${teamId}`))
        return toTeamEntitlement(team, await this.getAllTeamMembers(team.id))
    }

    async getAllChannelEntitlements(): Promise<MattermostChannelEntitlement[]> {
        const teams = await this.getAllTeams()
        const entitlements: MattermostChannelEntitlement[] = []

        for (const team of teams) {
            const channels = await this.getAllChannelsForTeam(team.id)

            for (const channel of channels) {
                const members = await this.getAllChannelMembers(channel.id)
                entitlements.push(toChannelEntitlement(channel, team, members))
            }
        }

        return entitlements
    }

    async getChannelEntitlement(channelId: string): Promise<MattermostChannelEntitlement> {
        const channel = mapMattermostChannelResponse(
            await this.http.request(`/api/v4/channels/${stripEntitlementPrefix(channelId, 'channel')}`)
        )
        const team = mapMattermostTeamResponse(await this.http.request(`/api/v4/teams/${channel.teamId}`))
        const members = await this.getAllChannelMembers(channel.id)

        return toChannelEntitlement(channel, team, members)
    }

    getRoleEntitlements(): MattermostEntitlement[] {
        return ROLE_DEFINITIONS.map(toRoleEntitlement)
    }

    getRoleEntitlement(roleName: string): MattermostEntitlement {
        const normalizedRoleName = stripEntitlementPrefix(roleName, 'role')
        const role = ROLE_DEFINITIONS.find((definition) => definition.roleName === normalizedRoleName)

        if (role) {
            return toRoleEntitlement(role)
        }

        return toRoleEntitlement({
            roleName: normalizedRoleName,
            name: toDisplayName(normalizedRoleName),
            description: `Mattermost ${normalizedRoleName} role`,
            riskLevel: normalizedRoleName.includes('admin') ? 'high' : 'medium',
            requestable: !normalizedRoleName.includes('admin'),
        })
    }

    async addUserToTeam(userId: string, teamId: string): Promise<void> {
        const rawTeamId = await this.resolveTeamId(teamId)
        await this.http.request(`/api/v4/teams/${rawTeamId}/members`, {}, 'POST', {
            team_id: rawTeamId,
            user_id: userId,
        })
    }

    async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
        await this.http.request(`/api/v4/teams/${await this.resolveTeamId(teamId)}/members/${userId}`, {}, 'DELETE')
    }

    async setUserTeams(userId: string, teamIds: string[]): Promise<void> {
        const desiredTeamIds = new Set(await Promise.all(teamIds.map((teamId) => this.resolveTeamId(teamId))))
        const currentTeamIds = new Set(
            (await this.getTeamIdsForUser(userId)).map((teamId) => stripEntitlementPrefix(teamId, 'team'))
        )

        for (const teamId of desiredTeamIds) {
            if (!currentTeamIds.has(teamId)) {
                await this.addUserToTeam(userId, teamId)
            }
        }

        for (const teamId of currentTeamIds) {
            if (!desiredTeamIds.has(teamId)) {
                await this.removeUserFromTeam(userId, teamId)
            }
        }
    }

    async addUserToChannel(userId: string, channelId: string): Promise<void> {
        const rawChannelId = stripEntitlementPrefix(channelId, 'channel')
        const channel = mapMattermostChannelResponse(await this.http.request(`/api/v4/channels/${rawChannelId}`))

        await this.ensureUserInTeam(userId, channel.teamId)
        await this.http.request(`/api/v4/channels/${rawChannelId}/members`, {}, 'POST', {
            user_id: userId,
        })
    }

    async removeUserFromChannel(userId: string, channelId: string): Promise<void> {
        await this.http.request(
            `/api/v4/channels/${stripEntitlementPrefix(channelId, 'channel')}/members/${userId}`,
            {},
            'DELETE'
        )
    }

    async setUserChannels(userId: string, channelIds: string[]): Promise<void> {
        const desiredChannelIds = new Set(channelIds.map((channelId) => stripEntitlementPrefix(channelId, 'channel')))
        const currentChannelIds = new Set(
            (await this.getAllChannelEntitlements())
                .filter((entitlement) => entitlement.memberIds?.includes(userId))
                .map((entitlement) => entitlement.channelId)
                .filter((channelId): channelId is string => Boolean(channelId))
        )

        for (const channelId of desiredChannelIds) {
            if (!currentChannelIds.has(channelId)) {
                await this.addUserToChannel(userId, channelId)
            }
        }

        for (const channelId of currentChannelIds) {
            if (!desiredChannelIds.has(channelId)) {
                await this.removeUserFromChannel(userId, channelId)
            }
        }
    }

    async getTeamIdsForUser(userId: string): Promise<string[]> {
        return (await this.getAllTeamEntitlements())
            .filter((entitlement) => entitlement.memberIds?.includes(userId))
            .map((entitlement) => entitlement.id)
    }

    async getChannelIdsForUser(userId: string): Promise<string[]> {
        return (await this.getAllChannelEntitlements())
            .filter((entitlement) => entitlement.memberIds?.includes(userId))
            .map((entitlement) => entitlement.id)
    }

    async getRoleNamesForUser(userId: string): Promise<{ teamRoles: Set<string>; channelRoles: Set<string> }> {
        const teamRoles = new Set<string>()
        const channelRoles = new Set<string>()

        for (const entitlement of await this.getAllTeamEntitlements()) {
            if (entitlement.memberIds?.includes(userId)) {
                teamRoles.add('team_user')
            }
            if (entitlement.adminIds?.includes(userId)) {
                teamRoles.add('team_admin')
            }
        }

        for (const entitlement of await this.getAllChannelEntitlements()) {
            if (entitlement.memberIds?.includes(userId)) {
                channelRoles.add('channel_user')
            }
            if (entitlement.adminIds?.includes(userId)) {
                channelRoles.add('channel_admin')
            }
        }

        return { teamRoles, channelRoles }
    }

    private async getAllTeams(): Promise<MattermostTeam[]> {
        return this.http.getPaged<MattermostTeam>(LIST_TEAMS, mapMattermostTeamResponse)
    }

    private async getAllTeamMembers(teamId: string): Promise<MattermostTeamMember[]> {
        return this.http.getPaged<MattermostTeamMember>(
            `/api/v4/teams/${teamId}/members`,
            mapMattermostTeamMemberResponse
        )
    }

    private async getAllChannelsForTeam(teamId: string): Promise<MattermostChannel[]> {
        const publicChannels = await this.http.getPaged<MattermostChannel>(
            `/api/v4/teams/${teamId}/channels`,
            mapMattermostChannelResponse
        )
        const privateChannels = await this.http.getPaged<MattermostChannel>(
            `/api/v4/teams/${teamId}/channels/private`,
            mapMattermostChannelResponse
        )

        return [...publicChannels, ...privateChannels]
    }

    private async getAllChannelMembers(channelId: string): Promise<MattermostChannelMember[]> {
        return this.http.getPaged<MattermostChannelMember>(
            `/api/v4/channels/${channelId}/members`,
            mapMattermostChannelMemberResponse
        )
    }

    private async ensureUserInTeam(userId: string, teamId: string): Promise<void> {
        const members = await this.getAllTeamMembers(teamId)
        if (!members.some((member) => member.userId === userId)) {
            await this.addUserToTeam(userId, teamId)
        }
    }

    private async resolveTeamId(teamIdOrName: string): Promise<string> {
        const rawTeamIdOrName = stripEntitlementPrefix(teamIdOrName, 'team')
        const lookupValue = normalizeIdentifier(rawTeamIdOrName)
        const teams = await this.getAllTeams()
        const team = teams.find(
            (candidate) =>
                normalizeIdentifier(candidate.id) === lookupValue ||
                normalizeIdentifier(candidate.name) === lookupValue ||
                normalizeIdentifier(candidate.displayName) === lookupValue
        )

        if (!team) {
            throw new ConnectorError(`Mattermost team "${teamIdOrName}" was not found`)
        }

        return team.id
    }
}

function toDisplayName(value: string): string {
    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function normalizeIdentifier(value: string): string {
    return value.trim().toLowerCase()
}
