import { AttributeChangeOp, StdAccountUpdateInput } from '@sailpoint/connector-sdk'
import { toStringArray } from '../common/helpers'
import { MattermostHttpClient } from '../common/http-client'
import { QueryParams } from '../common/types'
import { MattermostChannelService } from '../channels/service'
import { stripEntitlementPrefix, toRoleEntitlementId } from '../channels/mappers'
import { mapMattermostUserResponse } from './mappers'
import { applyPatchChange, toCreateUserRequest } from './payloads'
import { MattermostCreateAccountInput, MattermostPatchUserRequest, MattermostUser } from './types'
import { logMattermostCreatePayload } from '../../sailpoint/request-logging'

const LIST_USERS = '/api/v4/users'

export class MattermostUserService {
    constructor(
        private readonly http: MattermostHttpClient,
        private readonly channels: MattermostChannelService,
        private readonly userFilter: QueryParams
    ) {}

    async getAllAccounts(): Promise<MattermostUser[]> {
        const users = await this.http.getPaged<MattermostUser>(LIST_USERS, mapMattermostUserResponse, this.userFilter)
        const teamEntitlements = await this.channels.getAllTeamEntitlements()
        const channelEntitlements = await this.channels.getAllChannelEntitlements()
        const teamsByUserId = new Map<string, string[]>()
        const channelsByUserId = new Map<string, string[]>()
        const teamRolesByUserId = new Map<string, Set<string>>()
        const channelRolesByUserId = new Map<string, Set<string>>()

        for (const entitlement of teamEntitlements) {
            for (const memberId of entitlement.memberIds ?? []) {
                appendValue(teamsByUserId, memberId, entitlement.id)
            }

            for (const adminId of entitlement.adminIds ?? []) {
                appendRole(teamRolesByUserId, adminId, 'team_admin')
            }

            for (const memberId of entitlement.memberIds ?? []) {
                appendRole(teamRolesByUserId, memberId, 'team_user')
            }
        }

        for (const entitlement of channelEntitlements) {
            for (const memberId of entitlement.memberIds ?? []) {
                appendValue(channelsByUserId, memberId, entitlement.id)
            }

            for (const adminId of entitlement.adminIds ?? []) {
                appendRole(channelRolesByUserId, adminId, 'channel_admin')
            }

            for (const memberId of entitlement.memberIds ?? []) {
                appendRole(channelRolesByUserId, memberId, 'channel_user')
            }
        }

        return users.map((user) => ({
            ...user,
            ...buildAccessAttributes(
                user,
                teamsByUserId.get(user.id) ?? [],
                channelsByUserId.get(user.id) ?? [],
                teamRolesByUserId.get(user.id),
                channelRolesByUserId.get(user.id)
            ),
        }))
    }

    async getAccount(userId: string): Promise<MattermostUser> {
        return mapMattermostUserResponse(await this.http.request(`/api/v4/users/${userId}`))
    }

    async getAccountWithChannels(userId: string): Promise<MattermostUser> {
        const user = await this.getAccount(userId)
        const teams = await this.channels.getTeamIdsForUser(user.id)
        const channels = await this.channels.getChannelIdsForUser(user.id)
        const roles = await this.channels.getRoleNamesForUser(user.id)

        return {
            ...user,
            ...buildAccessAttributes(user, teams, channels, roles.teamRoles, roles.channelRoles),
        }
    }

    async createAccount(input: MattermostCreateAccountInput): Promise<MattermostUser> {
        const createPayload = toCreateUserRequest(input)
        logMattermostCreatePayload(createPayload)
        const user = mapMattermostUserResponse(await this.http.request(LIST_USERS, {}, 'POST', createPayload))

        for (const teamId of input.attributes.teams ?? []) {
            await this.channels.addUserToTeam(user.id, teamId)
        }

        for (const channelId of input.attributes.channels ?? []) {
            await this.channels.addUserToChannel(user.id, channelId)
        }

        await this.applyUnifiedEntitlementAdds(user.id, input.attributes.entitlements ?? [])

        if (input.attributes.roles) {
            await this.updateUserRoles(user.id, toSystemRoles(input.attributes.roles))
        }

        return this.getAccountWithChannels(user.id)
    }

    async updateAccount(input: StdAccountUpdateInput): Promise<MattermostUser> {
        const patch: MattermostPatchUserRequest = {}
        const teamsToAdd: string[] = []
        const teamsToRemove: string[] = []
        const channelsToAdd: string[] = []
        const channelsToRemove: string[] = []
        const entitlementIdsToAdd: string[] = []
        const entitlementIdsToRemove: string[] = []
        let teamsToSet: string[] | undefined
        let channelsToSet: string[] | undefined
        let entitlementIdsToSet: string[] | undefined
        let rolesToSet: string | undefined

        for (const change of input.changes) {
            if (change.attribute === 'teams') {
                const teamIds = toStringArray(change.value)
                if (change.op === AttributeChangeOp.Set) {
                    teamsToSet = teamIds
                } else if (change.op === AttributeChangeOp.Add) {
                    teamsToAdd.push(...teamIds)
                } else if (change.op === AttributeChangeOp.Remove) {
                    teamsToRemove.push(...teamIds)
                }
                continue
            }

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

            if (change.attribute === 'entitlements') {
                const entitlementIds = toStringArray(change.value)
                if (change.op === AttributeChangeOp.Set) {
                    entitlementIdsToSet = entitlementIds
                } else if (change.op === AttributeChangeOp.Add) {
                    entitlementIdsToAdd.push(...entitlementIds)
                } else if (change.op === AttributeChangeOp.Remove) {
                    entitlementIdsToRemove.push(...entitlementIds)
                }
                continue
            }

            if (change.attribute === 'roles' && change.op === AttributeChangeOp.Set) {
                rolesToSet = toSystemRoles(change.value)
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

        if (teamsToSet) {
            await this.channels.setUserTeams(input.identity, teamsToSet)
        }

        if (channelsToSet) {
            await this.channels.setUserChannels(input.identity, channelsToSet)
        }

        if (entitlementIdsToSet) {
            await this.setUnifiedEntitlements(input.identity, entitlementIdsToSet)
        }

        for (const teamId of teamsToAdd) {
            await this.channels.addUserToTeam(input.identity, teamId)
        }

        for (const channelId of channelsToAdd) {
            await this.channels.addUserToChannel(input.identity, channelId)
        }

        await this.applyUnifiedEntitlementAdds(input.identity, entitlementIdsToAdd)

        for (const teamId of teamsToRemove) {
            await this.channels.removeUserFromTeam(input.identity, teamId)
        }

        for (const channelId of channelsToRemove) {
            await this.channels.removeUserFromChannel(input.identity, channelId)
        }

        await this.applyUnifiedEntitlementRemoves(input.identity, entitlementIdsToRemove)

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

    private async setUnifiedEntitlements(userId: string, entitlementIds: string[]): Promise<void> {
        await this.channels.setUserTeams(
            userId,
            entitlementIds.filter((entitlementId) => entitlementId.startsWith('team:'))
        )
        await this.channels.setUserChannels(
            userId,
            entitlementIds.filter((entitlementId) => entitlementId.startsWith('channel:'))
        )

        const systemRoles = toSystemRoles(entitlementIds.filter((entitlementId) => entitlementId.startsWith('role:')))
        if (systemRoles) {
            await this.updateUserRoles(userId, systemRoles)
        }
    }

    private async applyUnifiedEntitlementAdds(userId: string, entitlementIds: string[]): Promise<void> {
        const systemRolesToAdd: string[] = []

        for (const entitlementId of entitlementIds) {
            if (entitlementId.startsWith('team:')) {
                await this.channels.addUserToTeam(userId, entitlementId)
            } else if (entitlementId.startsWith('channel:')) {
                await this.channels.addUserToChannel(userId, entitlementId)
            } else if (entitlementId.startsWith('role:')) {
                systemRolesToAdd.push(entitlementId)
            }
        }

        if (systemRolesToAdd.length > 0) {
            const currentRoles = (await this.getAccount(userId)).roles
            await this.updateUserRoles(userId, mergeSystemRoles(currentRoles, systemRolesToAdd))
        }
    }

    private async applyUnifiedEntitlementRemoves(userId: string, entitlementIds: string[]): Promise<void> {
        const systemRolesToRemove: string[] = []

        for (const entitlementId of entitlementIds) {
            if (entitlementId.startsWith('team:')) {
                await this.channels.removeUserFromTeam(userId, entitlementId)
            } else if (entitlementId.startsWith('channel:')) {
                await this.channels.removeUserFromChannel(userId, entitlementId)
            } else if (entitlementId.startsWith('role:')) {
                systemRolesToRemove.push(entitlementId)
            }
        }

        if (systemRolesToRemove.length > 0) {
            const currentRoles = (await this.getAccount(userId)).roles
            await this.updateUserRoles(userId, removeSystemRoles(currentRoles, systemRolesToRemove))
        }
    }
}

function buildAccessAttributes(
    user: MattermostUser,
    teams: string[],
    channels: string[],
    teamRoles: Set<string> = new Set(),
    channelRoles: Set<string> = new Set()
): Pick<MattermostUser, 'teams' | 'channels' | 'roleEntitlements' | 'entitlements'> {
    const roleEntitlements = toRoleEntitlements([
        ...toStringArray(user.roles),
        ...Array.from(teamRoles),
        ...Array.from(channelRoles),
    ])

    return {
        teams,
        channels,
        roleEntitlements,
        entitlements: [...teams, ...channels, ...roleEntitlements],
    }
}

function toRoleEntitlements(roles: string[]): string[] {
    return Array.from(
        new Set(
            roles
                .flatMap((roleSet) => roleSet.split(/\s+/))
                .filter(Boolean)
                .map(toRoleEntitlementId)
        )
    )
}

function toSystemRoles(value: unknown): string {
    return toStringArray(value)
        .flatMap((roleSet) => roleSet.split(/\s+/))
        .map((roleName) => stripEntitlementPrefix(roleName, 'role'))
        .filter((roleName) => roleName === 'system_admin' || roleName === 'system_user')
        .join(' ')
}

function mergeSystemRoles(currentRoles: string, rolesToAdd: string[]): string {
    const roles = new Set(
        toStringArray(currentRoles)
            .flatMap((roleSet) => roleSet.split(/\s+/))
            .filter(Boolean)
    )
    for (const role of toSystemRoles(rolesToAdd).split(/\s+/).filter(Boolean)) {
        roles.add(role)
    }
    return Array.from(roles).join(' ')
}

function removeSystemRoles(currentRoles: string, rolesToRemove: string[]): string {
    const roles = new Set(
        toStringArray(currentRoles)
            .flatMap((roleSet) => roleSet.split(/\s+/))
            .filter(Boolean)
    )
    for (const role of toSystemRoles(rolesToRemove).split(/\s+/).filter(Boolean)) {
        roles.delete(role)
    }
    return Array.from(roles).join(' ')
}

function appendValue(valuesByUserId: Map<string, string[]>, userId: string, value: string): void {
    const values = valuesByUserId.get(userId) ?? []
    values.push(value)
    valuesByUserId.set(userId, values)
}

function appendRole(rolesByUserId: Map<string, Set<string>>, userId: string, roleName: string): void {
    const roles = rolesByUserId.get(userId) ?? new Set<string>()
    roles.add(roleName)
    rolesByUserId.set(userId, roles)
}
