import {
    MattermostChannel,
    MattermostChannelEntitlement,
    MattermostChannelMember,
    MattermostChannelMemberResponse,
    MattermostChannelResponse,
    MattermostTeam,
    MattermostTeamResponse,
} from './types'

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
        id: channel.id,
        name: channel.name,
        displayName: channel.displayName || channel.name,
        type: channel.type,
        teamId: team.id,
        teamName: team.name,
        teamDisplayName: team.displayName || team.name,
        purpose: channel.purpose,
        header: channel.header,
        createdAt: channel.createAt,
        updatedAt: channel.updateAt,
        deletedAt: channel.deleteAt,
        memberIds: members.map((member) => member.userId),
        adminIds: members.filter((member) => member.schemeAdmin).map((member) => member.userId),
    }
}
