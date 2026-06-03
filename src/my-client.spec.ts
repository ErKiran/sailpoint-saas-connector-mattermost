import { ConnectorError, StandardCommand } from '@sailpoint/connector-sdk'
import { MattermostClient } from './mattermost'

const mockConfig: any = {
    token: 'xxx123'
}

describe('connector client unit tests', () => {

    const myClient = new MattermostClient(mockConfig)

    it('connector client list accounts', async () => {
        let allAccounts = await myClient.getAllAccounts()
        expect(allAccounts.length).toStrictEqual(2)
    })

    it('connector client test connection', async () => {
        expect(await myClient.testConnection()).toStrictEqual({})
    })

    it('connector client test connection', async () => {
        expect(await myClient.testConnection()).toStrictEqual({})
    })

    it('invalid connector client', async () => {
        try {
            new MattermostClient({})
        } catch (e) {
            expect(e instanceof ConnectorError).toBeTruthy()
        }
    })
})
