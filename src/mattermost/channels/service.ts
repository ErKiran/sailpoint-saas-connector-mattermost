import { MattermostHttpClient } from '../common/http-client'
import {
    mapMattermostChannelMemberResponse,
    mapMattermostChannelResponse,
    mapMattermostTeamResponse,
    toChannelEntitlement,
} from './mappers'
import { MattermostChannel, MattermostChannelEntitlement, MattermostChannelMember, MattermostTeam } from './types'

const LIST_TEAMS = '/api/v4/teams'

export class MattermostChannelService {
    constructor(private readonly http: MattermostHttpClient) {}

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

    async addUserToChannel(userId: string, channelId: string): Promise<void> {
        await this.http.request(`/api/v4/channels/${channelId}/members`, {}, 'POST', { user_id: userId })
    }

    async removeUserFromChannel(userId: string, channelId: string): Promise<void> {
        await this.http.request(`/api/v4/channels/${channelId}/members/${userId}`, {}, 'DELETE')
    }

    async setUserChannels(userId: string, channelIds: string[]): Promise<void> {
        const desiredChannelIds = new Set(channelIds)
        const currentChannelIds = new Set(
            (await this.getAllChannelEntitlements())
                .filter((entitlement) => entitlement.memberIds.includes(userId))
                .map((entitlement) => entitlement.id)
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

    async getChannelIdsForUser(userId: string): Promise<string[]> {
        return (await this.getAllChannelEntitlements())
            .filter((entitlement) => entitlement.memberIds.includes(userId))
            .map((entitlement) => entitlement.id)
    }

    private async getAllTeams(): Promise<MattermostTeam[]> {
        return this.http.getPaged<MattermostTeam>(LIST_TEAMS, mapMattermostTeamResponse)
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
}
