import { ConnectorError } from '@sailpoint/connector-sdk'
import { MattermostConfig, QueryParams } from './types'

const PAGE_SIZE = 200

export class MattermostHttpClient {
    private readonly token: string
    private readonly baseUrl: string

    constructor(config: MattermostConfig) {
        this.baseUrl = String(config?.baseUrl ?? '').replace(/\/+$/, '')
        this.token = config?.token ?? ''

        if (!this.token) {
            throw new ConnectorError('token must be provided from config')
        }

        if (!this.baseUrl) {
            throw new ConnectorError('baseUrl must be provided from config')
        }
    }

    async request(path: string, queryParams: QueryParams = {}, method = 'GET', body?: unknown): Promise<any> {
        const url = new URL(`${this.baseUrl}${path}`)

        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value))
            }
        }

        const response = await fetch(url, {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        })

        const responseBody = await response.json().catch(() => ({}))

        if (!response.ok) {
            const message =
                typeof responseBody?.message === 'string'
                    ? responseBody.message
                    : `Mattermost API request failed with status ${response.status}`
            throw new ConnectorError(message)
        }

        return responseBody
    }

    async getPaged<T>(path: string, mapper: (value: any) => T, queryParams: QueryParams = {}): Promise<T[]> {
        const records: T[] = []
        let page = 0

        while (true) {
            const response = await this.request(path, { ...queryParams, page, per_page: PAGE_SIZE })

            if (!Array.isArray(response)) {
                throw new ConnectorError(`${path} did not return an array`)
            }

            records.push(...response.map(mapper))

            if (response.length < PAGE_SIZE) {
                return records
            }

            page += 1
        }
    }
}
