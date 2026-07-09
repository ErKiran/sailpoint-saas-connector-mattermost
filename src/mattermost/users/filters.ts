import { ConnectorError } from '@sailpoint/connector-sdk'
import { MattermostConfig } from '../common/types'
import { normalizeCommaSeparated, parseBoolean, removeEmptyValues, trimToUndefined } from '../common/helpers'
import { MattermostListUsersQuery } from './types'

export function buildUserFilter(config: MattermostConfig): MattermostListUsersQuery {
    const active = parseBoolean(config?.userActive)
    const inactive = parseBoolean(config?.userInactive)

    if (active && inactive) {
        throw new ConnectorError('userActive and userInactive filters cannot both be enabled')
    }

    return removeEmptyValues({
        active,
        inactive,
        in_team: trimToUndefined(config?.userInTeam),
        not_in_team: trimToUndefined(config?.userNotInTeam),
        in_channel: trimToUndefined(config?.userInChannel),
        not_in_channel: trimToUndefined(config?.userNotInChannel),
        without_team: parseBoolean(config?.userWithoutTeam),
        role: trimToUndefined(config?.userRole),
        roles: normalizeCommaSeparated(config?.userRoles),
        team_roles: normalizeCommaSeparated(config?.userTeamRoles),
        channel_roles: normalizeCommaSeparated(config?.userChannelRoles),
        sort: trimToUndefined(config?.userSort),
    }) as MattermostListUsersQuery
}
