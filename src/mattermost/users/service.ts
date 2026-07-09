import { AttributeChangeOp, StdAccountCreateInput, StdAccountUpdateInput } from '@sailpoint/connector-sdk'
import { toStringArray } from '../common/helpers'
import { MattermostHttpClient } from '../common/http-client'
import { QueryParams } from '../common/types'
import { MattermostChannelService } from '../channels/service'
import { mapMattermostUserResponse } from './mappers'
import { applyPatchChange, toCreateUserRequest } from './payloads'
import { MattermostAccountAttributes, MattermostPatchUserRequest, MattermostUser } from './types'

const LIST_USERS = '/api/v4/users'

export class MattermostUserService {
    constructor(
        private readonly http: MattermostHttpClient,
        private readonly channels: MattermostChannelService,
        private readonly userFilter: QueryParams
    ) {}

    async getAllAccounts(): Promise<MattermostUser[]> {
        const users = await this.http.getPaged<MattermostUser>(LIST_USERS, mapMattermostUserResponse, this.userFilter)
        const entitlements = await this.channels.getAllChannelEntitlements()
        const channelIdsByUserId = new Map<string, string[]>()

        for (const entitlement of entitlements) {
            for (const memberId of entitlement.memberIds) {
                const channelIds = channelIdsByUserId.get(memberId) ?? []
                channelIds.push(entitlement.id)
                channelIdsByUserId.set(memberId, channelIds)
            }
        }

        return users.map((user) => ({
            ...user,
            channels: channelIdsByUserId.get(user.id) ?? [],
        }))
    }

    async getAccount(userId: string): Promise<MattermostUser> {
        return mapMattermostUserResponse(await this.http.request(`/api/v4/users/${userId}`))
    }

    async getAccountWithChannels(userId: string): Promise<MattermostUser> {
        const user = await this.getAccount(userId)
        return {
            ...user,
            channels: await this.channels.getChannelIdsForUser(user.id),
        }
    }

    async createAccount(input: StdAccountCreateInput): Promise<MattermostUser> {
        const attributes = input.attributes as MattermostAccountAttributes
        const user = mapMattermostUserResponse(
            await this.http.request(LIST_USERS, {}, 'POST', toCreateUserRequest(attributes))
        )

        for (const channelId of attributes.channels ?? []) {
            await this.channels.addUserToChannel(user.id, channelId)
        }

        if (attributes.roles) {
            await this.updateUserRoles(user.id, attributes.roles)
        }

        return this.getAccountWithChannels(user.id)
    }

    async updateAccount(input: StdAccountUpdateInput): Promise<MattermostUser> {
        const patch: MattermostPatchUserRequest = {}
        const channelsToAdd: string[] = []
        const channelsToRemove: string[] = []
        let channelsToSet: string[] | undefined
        let rolesToSet: string | undefined

        for (const change of input.changes) {
            if (change.attribute === 'channels') {
                const channelIds = toStringArray(change.value)
                if (change.op === AttributeChangeOp.Set) {
                    channelsToSet = channelIds
                } else if (change.op === AttributeChangeOp.Add) {
                    channelsToAdd.push(...channelIds)
                } else if (change.op === AttributeChangeOp.Remove) {
                    channelsToRemove.push(...channelIds)
                }
                continue
            }

            if (change.attribute === 'roles' && change.op === AttributeChangeOp.Set) {
                rolesToSet = String(change.value)
                continue
            }

            if (change.op === AttributeChangeOp.Set) {
                applyPatchChange(patch, change)
            }
        }

        if (Object.keys(patch).length > 0) {
            await this.http.request(`/api/v4/users/${input.identity}/patch`, {}, 'PUT', patch)
        }

        if (rolesToSet) {
            await this.updateUserRoles(input.identity, rolesToSet)
        }

        if (channelsToSet) {
            await this.channels.setUserChannels(input.identity, channelsToSet)
        }

        for (const channelId of channelsToAdd) {
            await this.channels.addUserToChannel(input.identity, channelId)
        }

        for (const channelId of channelsToRemove) {
            await this.channels.removeUserFromChannel(input.identity, channelId)
        }

        return this.getAccountWithChannels(input.identity)
    }

    async deleteAccount(userId: string): Promise<{}> {
        await this.http.request(`/api/v4/users/${userId}`, {}, 'DELETE')
        return {}
    }

    async setAccountActive(userId: string, active: boolean): Promise<MattermostUser> {
        await this.http.request(`/api/v4/users/${userId}/active`, {}, 'PUT', { active })
        return this.getAccountWithChannels(userId)
    }

    private async updateUserRoles(userId: string, roles: string): Promise<void> {
        await this.http.request(`/api/v4/users/${userId}/roles`, {}, 'PUT', { roles })
    }
}
