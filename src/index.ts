import {
    Context,
    createConnector,
    readConfig,
    Response,
    logger,
    StdAccountListOutput,
    StdTestConnectionOutput,
    StdAccountListInput,
    StdTestConnectionInput,
    StdEntitlementListInput,
    StdEntitlementListOutput,
    StdEntitlementReadInput,
    StdEntitlementReadOutput,
    StdAccountCreateInput,
    StdAccountCreateOutput,
    StdAccountUpdateInput,
    StdAccountUpdateOutput,
    StdAccountDeleteInput,
    StdAccountDeleteOutput,
    StdAccountReadInput,
    StdAccountReadOutput,
    StdAccountDisableInput,
    StdAccountDisableOutput,
    StdAccountEnableInput,
    StdAccountEnableOutput,
    StdAccountUnlockInput,
    StdAccountUnlockOutput,
} from '@sailpoint/connector-sdk'
import { MattermostClient } from './mattermost'
import { toStdAccountOutput } from './sailpoint/account-output'
import { toStdEntitlementOutput } from './sailpoint/entitlement-output'

// Connector must be exported as module property named connector
export const connector = async () => {
    // Get connector source config
    const config = await readConfig()

    // Use the vendor SDK, or implement own client as necessary, to initialize a client
    const mattermost = new MattermostClient(config)

    return createConnector()
        .stdTestConnection(
            async (context: Context, input: StdTestConnectionInput, res: Response<StdTestConnectionOutput>) => {
                logger.info('Running test connection')
                res.send(await mattermost.testConnection())
            }
        )
        .stdAccountList(async (context: Context, input: StdAccountListInput, res: Response<StdAccountListOutput>) => {
            const accounts = await mattermost.getAllAccounts()

            for (const account of accounts) {
                res.send(toStdAccountOutput(account))
            }
            logger.info(`stdAccountList sent ${accounts.length} accounts`)
        })
        .stdAccountRead(async (context: Context, input: StdAccountReadInput, res: Response<StdAccountReadOutput>) => {
            res.send(toStdAccountOutput(await mattermost.getAccount(input.identity)))
        })
        .stdAccountCreate(
            async (context: Context, input: StdAccountCreateInput, res: Response<StdAccountCreateOutput>) => {
                res.send(toStdAccountOutput(await mattermost.createAccount(input)))
            }
        )
        .stdAccountUpdate(
            async (context: Context, input: StdAccountUpdateInput, res: Response<StdAccountUpdateOutput>) => {
                res.send(toStdAccountOutput(await mattermost.updateAccount(input)))
            }
        )
        .stdAccountDelete(
            async (context: Context, input: StdAccountDeleteInput, res: Response<StdAccountDeleteOutput>) => {
                res.send(await mattermost.deleteAccount(input.identity))
            }
        )
        .stdAccountDisable(
            async (context: Context, input: StdAccountDisableInput, res: Response<StdAccountDisableOutput>) => {
                res.send(toStdAccountOutput(await mattermost.setAccountActive(input.identity, false)))
            }
        )
        .stdAccountEnable(
            async (context: Context, input: StdAccountEnableInput, res: Response<StdAccountEnableOutput>) => {
                res.send(toStdAccountOutput(await mattermost.setAccountActive(input.identity, true)))
            }
        )
        .stdAccountUnlock(
            async (context: Context, input: StdAccountUnlockInput, res: Response<StdAccountUnlockOutput>) => {
                res.send(toStdAccountOutput(await mattermost.unlockAccount(input.identity)))
            }
        )
        .stdEntitlementList(
            async (context: Context, input: StdEntitlementListInput, res: Response<StdEntitlementListOutput>) => {
                const entitlements = (await mattermost.getAllEntitlements()).filter(
                    (entitlement) => !input?.type || entitlement.type === input.type
                )

                for (const entitlement of entitlements) {
                    res.send(toStdEntitlementOutput(entitlement))
                }

                logger.info(`stdEntitlementList sent ${entitlements.length} entitlements`)
            }
        )
        .stdEntitlementRead(
            async (context: Context, input: StdEntitlementReadInput, res: Response<StdEntitlementReadOutput>) => {
                res.send(toStdEntitlementOutput(await mattermost.getEntitlement(input.type, input.identity)))
            }
        )
}
