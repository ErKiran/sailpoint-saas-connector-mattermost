import {
    Context,
    createConnector,
    readConfig,
    Response,
    logger,
    StdAccountListOutput,
    StdTestConnectionOutput,
    StdAccountListInput,
    StdTestConnectionInput
} from '@sailpoint/connector-sdk'
import { MattermostClient } from './mattermost'

// Connector must be exported as module property named connector
export const connector = async () => {

    // Get connector source config
    const config = await readConfig()

    // Use the vendor SDK, or implement own client as necessary, to initialize a client
    const mattermost = new MattermostClient(config)

    return createConnector()
        .stdTestConnection(async (context: Context, input: StdTestConnectionInput, res: Response<StdTestConnectionOutput>) => {
            logger.info("Running test connection")
            res.send(await mattermost.testConnection())
        })
        .stdAccountList(async (context: Context, input: StdAccountListInput, res: Response<StdAccountListOutput>) => {
            const accounts = await mattermost.getAllAccounts()

            for (const account of accounts) {
                res.send({
                    identity: account.username,
                    uuid: account.id,
                    attributes: {
                        firstName: account.firstName,
                        lastName: account.lastName,
                        createdAt: account.createAt,
                        updatedAt: account.updateAt,
                        userName: account.username,
                        position: account.position,
                        email: account.email,
                        nickname: account.nickname,
                        emailVerified: account.emailVerified,
                        roles: account.roles,
                        locale: account.locale,
                        timeZone: account.timezone?.automaticTimezone || null
                    },
                })
            }
            logger.info(`stdAccountList sent ${accounts.length} accounts`)
        })
}
