export type QueryParams = Record<string, string | number | boolean | undefined>

export interface MattermostConfig {
    token?: string
    baseUrl?: string
    userActive?: boolean | string
    userInactive?: boolean | string
    userInTeam?: string
    userNotInTeam?: string
    userInChannel?: string
    userNotInChannel?: string
    userWithoutTeam?: boolean | string
    userRole?: string
    userRoles?: string
    userTeamRoles?: string
    userChannelRoles?: string
    userSort?: string
}
