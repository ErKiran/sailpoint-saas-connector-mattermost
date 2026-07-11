export interface MattermostListUsersQuery {
    active?: boolean
    inactive?: boolean
    in_team?: string
    not_in_team?: string
    in_channel?: string
    not_in_channel?: string
    without_team?: boolean
    role?: string
    roles?: string
    team_roles?: string
    channel_roles?: string
    sort?: string
}

export interface MattermostAccountAttributes {
    id?: string
    email?: string
    userName?: string
    username?: string
    firstName?: string
    lastName?: string
    nickname?: string
    position?: string
    locale?: string
    password?: string
    authData?: string
    authService?: string
    roles?: string
    teams?: string[]
    channels?: string[]
    entitlements?: string[]
}

export interface MattermostCreateUserRequest {
    email: string
    username: string
    first_name?: string
    last_name?: string
    nickname?: string
    position?: string
    locale?: string
    password?: string
    auth_data?: string
    auth_service?: string
}

export interface MattermostPatchUserRequest {
    email?: string
    username?: string
    first_name?: string
    last_name?: string
    nickname?: string
    position?: string
    locale?: string
}

export interface MattermostUserSchema {
    id: string
    create_at: number
    update_at: number
    delete_at: number
    username: string
    first_name: string
    last_name: string
    nickname: string
    email: string
    email_verified: boolean
    auth_service: string
    roles: string
    locale: string
    position: string
    notify_props?: Partial<MattermostNotifyPropsResponse>
    props?: Record<string, unknown>
    last_password_update: number
    last_picture_update: number
    failed_attempts: number
    mfa_active: boolean
    timezone?: Partial<MattermostTimezone>
    terms_of_service_id?: string
    terms_of_service_create_at?: number
}

export type MattermostUserResponse = MattermostUserSchema

export interface MattermostUser {
    id: string
    createAt: number
    updateAt: number
    deleteAt: number
    username: string
    firstName: string
    lastName: string
    nickname: string
    email: string
    emailVerified: boolean
    authService: string
    roles: string
    position: string
    locale: string
    notifyProps?: Partial<MattermostNotifyProps>
    props?: Record<string, unknown>
    lastPasswordUpdate: number
    lastPictureUpdate: number
    failedAttempts: number
    mfaActive: boolean
    timezone?: Partial<MattermostTimezone>
    termsOfServiceId?: string
    termsOfServiceCreateAt?: number
    teams?: string[]
    channels?: string[]
    roleEntitlements?: string[]
    entitlements?: string[]
}

export interface MattermostNotifyPropsResponse {
    email: string
    push: string
    desktop: string
    desktop_sound: string
    mention_keys: string
    channel: string
    first_name: string
    auto_responder_message: string
    push_threads: string
    comments: string
    desktop_threads: string
    email_threads: string
}

export interface MattermostNotifyProps {
    email: string
    push: string
    desktop: string
    desktopSound: string
    mentionKeys: string
    channel: string
    firstName: string
    autoResponderMessage: string
    pushThreads: string
    comments: string
    desktopThreads: string
    emailThreads: string
}

export interface MattermostTimezone {
    useAutomaticTimezone: string
    manualTimezone: string
    automaticTimezone: string
}
