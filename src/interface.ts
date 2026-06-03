export interface MattermostUserResponse {
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

export function mapMattermostUserResponse(user: MattermostUserResponse): MattermostUser {
  return {
    id: user.id,
    createAt: user.create_at,
    updateAt: user.update_at,
    deleteAt: user.delete_at,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    nickname: user.nickname,
    email: user.email,
    emailVerified: user.email_verified,
    authService: user.auth_service,
    roles: user.roles,
    position: user.position,
    locale: user.locale,
    notifyProps: user.notify_props
      ? {
          email: user.notify_props.email,
          push: user.notify_props.push,
          desktop: user.notify_props.desktop,
          desktopSound: user.notify_props.desktop_sound,
          mentionKeys: user.notify_props.mention_keys,
          channel: user.notify_props.channel,
          firstName: user.notify_props.first_name,
          autoResponderMessage: user.notify_props.auto_responder_message,
          pushThreads: user.notify_props.push_threads,
          comments: user.notify_props.comments,
          desktopThreads: user.notify_props.desktop_threads,
          emailThreads: user.notify_props.email_threads
        }
      : undefined,
    props: user.props,
    lastPasswordUpdate: user.last_password_update,
    lastPictureUpdate: user.last_picture_update,
    failedAttempts: user.failed_attempts,
    mfaActive: user.mfa_active,
    timezone: user.timezone,
    termsOfServiceId: user.terms_of_service_id,
    termsOfServiceCreateAt: user.terms_of_service_create_at
  }
}