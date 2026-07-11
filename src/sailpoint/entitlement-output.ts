import { StdEntitlementListOutput, StdEntitlementReadOutput } from '@sailpoint/connector-sdk'
import { MattermostEntitlement } from '../mattermost/channels/types'

export function toStdEntitlementOutput(
    entitlement: MattermostEntitlement
): StdEntitlementListOutput | StdEntitlementReadOutput {
    return {
        identity: entitlement.name,
        uuid: entitlement.id,
        type: entitlement.type,
        attributes: {
            id: entitlement.id,
            name: entitlement.name,
            displayName: entitlement.displayName ?? entitlement.name,
            type: entitlement.type,
            description: entitlement.description,
            teamId: entitlement.teamId ?? null,
            teamName: entitlement.teamName ?? null,
            teamDisplayName: entitlement.teamDisplayName ?? null,
            channelId: entitlement.channelId ?? null,
            roleName: entitlement.roleName ?? null,
            riskLevel: entitlement.riskLevel ?? null,
            requestable: entitlement.requestable ?? null,
            purpose: entitlement.purpose ?? null,
            header: entitlement.header ?? null,
            createdAt: entitlement.createdAt ?? null,
            updatedAt: entitlement.updatedAt ?? null,
            deletedAt: entitlement.deletedAt ?? null,
            memberIds: entitlement.memberIds ?? [],
            adminIds: entitlement.adminIds ?? [],
        },
    }
}
