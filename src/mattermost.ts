import { StdAccountCreateInput, StdAccountUpdateInput } from '@sailpoint/connector-sdk'
import { MattermostChannelService } from './mattermost/channels/service'
import { MattermostChannelEntitlement, MattermostEntitlement } from './mattermost/channels/types'
import { MattermostHttpClient } from './mattermost/common/http-client'
import { MattermostConfig } from './mattermost/common/types'
import { buildUserFilter } from './mattermost/users/filters'
import { MattermostUserService } from './mattermost/users/service'
import { MattermostUser } from './mattermost/users/types'

const PING_PATH = '/api/v4/system/ping'

export class MattermostClient {
    private readonly http: MattermostHttpClient
    private readonly channels: MattermostChannelService
    private readonly users: MattermostUserService

    constructor(config: MattermostConfig) {
        this.http = new MattermostHttpClient(config)
        this.channels = new MattermostChannelService(this.http)
        this.users = new MattermostUserService(this.http, this.channels, { ...buildUserFilter(config) })
    }

    async testConnection(): Promise<{}> {
        await this.http.request(PING_PATH)
        return {}
    }

    async getAllAccounts(): Promise<MattermostUser[]> {
        return this.users.getAllAccounts()
    }

    async getAccount(userId: string): Promise<MattermostUser> {
        return this.users.getAccount(userId)
    }

    async createAccount(input: StdAccountCreateInput): Promise<MattermostUser> {
        return this.users.createAccount(input)
    }

    async updateAccount(input: StdAccountUpdateInput): Promise<MattermostUser> {
        return this.users.updateAccount(input)
    }

    async deleteAccount(userId: string): Promise<{}> {
        return this.users.deleteAccount(userId)
    }

    async setAccountActive(userId: string, active: boolean): Promise<MattermostUser> {
        return this.users.setAccountActive(userId, active)
    }

    async unlockAccount(userId: string): Promise<MattermostUser> {
        return this.users.setAccountActive(userId, true)
    }

    async getAllChannelEntitlements(): Promise<MattermostChannelEntitlement[]> {
        return this.channels.getAllChannelEntitlements()
    }

    async getChannelEntitlement(channelId: string): Promise<MattermostChannelEntitlement> {
        return this.channels.getChannelEntitlement(channelId)
    }

    async getAllEntitlements(): Promise<MattermostEntitlement[]> {
        return this.channels.getAllEntitlements()
    }

    async getEntitlement(type: string, entitlementId: string): Promise<MattermostEntitlement> {
        return this.channels.getEntitlement(type, entitlementId)
    }
}
