export interface MattermostTeamResponse {
    id: string
    create_at: number
    update_at: number
    delete_at: number
    display_name: string
    name: string
    description: string
    email: string
    type: string
    allowed_domains: string
    invite_id: string
    allow_open_invite: boolean
}

export interface MattermostTeam {
    id: string
    createAt: number
    updateAt: number
    deleteAt: number
    displayName: string
    name: string
    description: string
    email: string
    type: string
    allowedDomains: string
    inviteId: string
    allowOpenInvite: boolean
}

export interface MattermostTeamMemberResponse {
    team_id: string
    user_id: string
    roles: string
    delete_at: number
    scheme_guest: boolean
    scheme_user: boolean
    scheme_admin: boolean
}

export interface MattermostTeamMember {
    teamId: string
    userId: string
    roles: string
    deleteAt: number
    schemeGuest: boolean
    schemeUser: boolean
    schemeAdmin: boolean
}

export interface MattermostChannelResponse {
    id: string
    create_at: number
    update_at: number
    delete_at: number
    team_id: string
    type: string
    display_name: string
    name: string
    header: string
    purpose: string
    creator_id: string
    total_msg_count: number
    extra_update_at: number
}

export interface MattermostChannel {
    id: string
    createAt: number
    updateAt: number
    deleteAt: number
    teamId: string
    type: string
    displayName: string
    name: string
    header: string
    purpose: string
    creatorId: string
    totalMessageCount: number
    extraUpdateAt: number
}

export interface MattermostChannelMemberResponse {
    channel_id: string
    user_id: string
    roles: string
    last_viewed_at: number
    msg_count: number
    mention_count: number
    notify_props?: Record<string, string>
    last_update_at: number
    scheme_guest: boolean
    scheme_user: boolean
    scheme_admin: boolean
}

export interface MattermostChannelMember {
    channelId: string
    userId: string
    roles: string
    lastViewedAt: number
    messageCount: number
    mentionCount: number
    notifyProps?: Record<string, string>
    lastUpdateAt: number
    schemeGuest: boolean
    schemeUser: boolean
    schemeAdmin: boolean
}

export type MattermostEntitlementType = 'team' | 'channel' | 'role'

export interface MattermostEntitlement {
    id: string
    name: string
    type: MattermostEntitlementType
    description: string
    displayName?: string
    teamId?: string
    teamName?: string
    teamDisplayName?: string
    channelId?: string
    roleName?: string
    riskLevel?: string
    requestable?: boolean
    purpose?: string
    header?: string
    createdAt?: number
    updatedAt?: number
    deletedAt?: number
    memberIds?: string[]
    adminIds?: string[]
}

export type MattermostChannelEntitlement = MattermostEntitlement

export interface MattermostRoleDefinition {
    roleName: string
    name: string
    description: string
    riskLevel: string
    requestable: boolean
}
