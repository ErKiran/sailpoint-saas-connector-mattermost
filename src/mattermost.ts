import { ConnectorError } from "@sailpoint/connector-sdk"
import { mapMattermostUserResponse, MattermostUser } from "./interface"

const PING_PATH = "/api/v4/system/ping"
const LIST_USERS = "/api/v4/users

export class MattermostClient {
    private readonly token?: string
    private readonly baseUrl?: string

    constructor(config: any) {
        this.baseUrl = config?.baseUrl
        this.token = config?.token

        if (!this.token) {
            throw new ConnectorError('token must be provided from config')
        }

        if(!this.baseUrl){
              throw new ConnectorError('baseUrl must be provided from config')
        }

    }

    async request(path:string): Promise<any>{
        const url = `${this.baseUrl}${path}`

        const response = await fetch(url, {
            method: "GET",
            headers:{
                Accept: "application/json",
                Authorization: `Bearer ${this.token}`
            }

        })

        return response.json()
    }

    async getAllAccounts(): Promise<MattermostUser[]> {
        const accounts: MattermostUser[] = []
        const users = await this.request(LIST_USERS)

        if(!Array.isArray(users)){
            throw new ConnectorError("Users list isn't a array ")
        }

        for(const user of users){
            accounts.push({...mapMattermostUserResponse(user)})
        }

        return accounts
    }

    async testConnection(): Promise<any> {
        const ping = await this.request(PING_PATH)
        return ping
    }
}
