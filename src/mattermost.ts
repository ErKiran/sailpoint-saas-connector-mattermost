import { ConnectorError } from "@sailpoint/connector-sdk"


export class MattermostClient {
    private readonly token?: string
    private readonly baseUrl?: string

    constructor(config: any) {
      
        this.token = config?.token
        this.baseUrl = config?.baseUrl

        if (!this.token) {
            throw new ConnectorError('token must be provided from config')
        }

         if (!this.baseUrl) {
            throw new ConnectorError('baseUrl must be provided from config')
        }
    }

    private async request(path: string): Promise<any>{
        const url = `${this.baseUrl}${path}`

        const response = await fetch(url, {
            method: "GET",
            headers:{
                Authorization: `Bearer ${this.token}`,
                Accept: 'application/json'
            }
        })

        if(!response.ok){
            throw new ConnectorError(`Mattermost API Request failed: ${response.status} \t ${response.statusText}`)
        }

        return {}
    }

    async getAllAccounts(): Promise<any[]> {
        return []
    }

    async getAccount(identity: string): Promise<any> {
        return null
    }

    async testConnection(): Promise<any> {
        const response = await this.request('/api/v4/system/ping')
        return response
    }
}
