import {
    MattermostChannel,
    MattermostChannelEntitlement,
    MattermostChannelMember,
    MattermostChannelMemberResponse,
    MattermostChannelResponse,
    MattermostEntitlement,
    MattermostRoleDefinition,
    MattermostTeam,
    MattermostTeamMember,
    MattermostTeamMemberResponse,
    MattermostTeamResponse,
} from './types'

export const ROLE_DEFINITIONS: MattermostRoleDefinition[] = [
    {
        roleName: 'system_admin',
        name: 'System Admin',
        description: 'Mattermost system administrator role',
        riskLevel: 'critical',
        requestable: false,
    },
    {
        roleName: 'system_user',
        name: 'System User',
        description: 'Mattermost standard system user role',
        riskLevel: 'low',
        requestable: true,
    },
    {
        roleName: 'team_admin',
        name: 'Team Admin',
        description: 'Mattermost team administrator role',
        riskLevel: 'high',
        requestable: false,
    },
    {
        roleName: 'team_user',
        name: 'Team User',
        description: 'Mattermost team member role',
        riskLevel: 'medium',
        requestable: true,
    },
    {
        roleName: 'channel_admin',
        name: 'Channel Admin',
        description: 'Mattermost channel administrator role',
        riskLevel: 'high',
        requestable: false,
    },
    {
        roleName: 'channel_user',
        name: 'Channel User',
        description: 'Mattermost channel member role',
        riskLevel: 'medium',
        requestable: true,
    },
    {
        roleName: 'guest',
        name: 'Guest',
        description: 'Mattermost guest access role',
        riskLevel: 'medium',
        requestable: true,
    },
]

export function mapMattermostTeamResponse(team: MattermostTeamResponse): MattermostTeam {
    return {
        id: team.id,
        createAt: team.create_at,
        updateAt: team.update_at,
        deleteAt: team.delete_at,
        displayName: team.display_name,
        name: team.name,
        description: team.description,
        email: team.email,
        type: team.type,
        allowedDomains: team.allowed_domains,
        inviteId: team.invite_id,
        allowOpenInvite: team.allow_open_invite,
    }
}

export function mapMattermostTeamMemberResponse(member: MattermostTeamMemberResponse): MattermostTeamMember {
    return {
        teamId: member.team_id,
        userId: member.user_id,
        roles: member.roles,
        deleteAt: member.delete_at,
        schemeGuest: member.scheme_guest,
        schemeUser: member.scheme_user,
        schemeAdmin: member.scheme_admin,
    }
}

export function mapMattermostChannelResponse(channel: MattermostChannelResponse): MattermostChannel {
    return {
        id: channel.id,
        createAt: channel.create_at,
        updateAt: channel.update_at,
        deleteAt: channel.delete_at,
        teamId: channel.team_id,
        type: channel.type,
        displayName: channel.display_name,
        name: channel.name,
        header: channel.header,
        purpose: channel.purpose,
        creatorId: channel.creator_id,
        totalMessageCount: channel.total_msg_count,
        extraUpdateAt: channel.extra_update_at,
    }
}

export function mapMattermostChannelMemberResponse(member: MattermostChannelMemberResponse): MattermostChannelMember {
    return {
        channelId: member.channel_id,
        userId: member.user_id,
        roles: member.roles,
        lastViewedAt: member.last_viewed_at,
        messageCount: member.msg_count,
        mentionCount: member.mention_count,
        notifyProps: member.notify_props,
        lastUpdateAt: member.last_update_at,
        schemeGuest: member.scheme_guest,
        schemeUser: member.scheme_user,
        schemeAdmin: member.scheme_admin,
    }
}

export function toChannelEntitlement(
    channel: MattermostChannel,
    team: MattermostTeam,
    members: MattermostChannelMember[]
): MattermostChannelEntitlement {
    return {
        id: toChannelEntitlementId(channel.id),
        name: channel.displayName || channel.name,
        displayName: channel.displayName || channel.name,
        type: 'channel',
        description: channel.purpose || `Access to the ${channel.displayName || channel.name} channel`,
        channelId: channel.id,
        teamId: team.id,
        teamName: team.name,
        teamDisplayName: team.displayName || team.name,
        riskLevel: channel.type === 'P' ? 'high' : 'medium',
        requestable: true,
        purpose: channel.purpose,
        header: channel.header,
        createdAt: channel.createAt,
        updatedAt: channel.updateAt,
        deletedAt: channel.deleteAt,
        memberIds: members.map((member) => member.userId),
        adminIds: members.filter((member) => member.schemeAdmin).map((member) => member.userId),
    }
}

export function toTeamEntitlement(team: MattermostTeam, members: MattermostTeamMember[]): MattermostEntitlement {
    return {
        id: toTeamEntitlementId(team.id),
        name: team.displayName || team.name,
        type: 'team',
        description: team.description || `Membership to the ${team.displayName || team.name} team`,
        teamId: team.id,
        teamName: team.name,
        teamDisplayName: team.displayName || team.name,
        riskLevel: 'medium',
        requestable: true,
        createdAt: team.createAt,
        updatedAt: team.updateAt,
        deletedAt: team.deleteAt,
        memberIds: members.map((member) => member.userId),
        adminIds: members.filter((member) => member.schemeAdmin).map((member) => member.userId),
    }
}

export function toRoleEntitlement(role: MattermostRoleDefinition): MattermostEntitlement {
    return {
        id: toRoleEntitlementId(role.roleName),
        name: role.name,
        type: 'role',
        description: role.description,
        roleName: role.roleName,
        riskLevel: role.riskLevel,
        requestable: role.requestable,
    }
}

export function toTeamEntitlementId(teamId: string): string {
    return `team:${teamId}`
}

export function toChannelEntitlementId(channelId: string): string {
    return `channel:${channelId}`
}

export function toRoleEntitlementId(roleName: string): string {
    return `role:${roleName}`
}

export function stripEntitlementPrefix(entitlementId: string, type: 'team' | 'channel' | 'role'): string {
    const prefix = `${type}:`
    return entitlementId.startsWith(prefix) ? entitlementId.slice(prefix.length) : entitlementId
}
