import { MattermostUser, MattermostUserSchema } from './types'

export function mapMattermostUserResponse(user: MattermostUserSchema): MattermostUser {
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
                  emailThreads: user.notify_props.email_threads,
              }
            : undefined,
        props: user.props,
        lastPasswordUpdate: user.last_password_update,
        lastPictureUpdate: user.last_picture_update,
        failedAttempts: user.failed_attempts,
        mfaActive: user.mfa_active,
        timezone: user.timezone,
        termsOfServiceId: user.terms_of_service_id,
        termsOfServiceCreateAt: user.terms_of_service_create_at,
    }
}
