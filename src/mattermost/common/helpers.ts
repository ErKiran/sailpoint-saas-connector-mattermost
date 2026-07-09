export function parseBoolean(value: boolean | string | undefined): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim().toLowerCase()

    if (normalizedValue === 'true') {
        return true
    }

    if (normalizedValue === 'false') {
        return false
    }

    return undefined
}

export function trimToUndefined(value: string | undefined): string | undefined {
    const trimmedValue = value?.trim()
    return trimmedValue ? trimmedValue : undefined
}

export function normalizeCommaSeparated(value: string | undefined): string | undefined {
    const normalizedValue = value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .join(',')

    return normalizedValue || undefined
}

export function removeEmptyValues<T extends Record<string, unknown>>(query: T): Partial<T> {
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as Partial<T>
}

export function toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(String).filter(Boolean)
    }

    if (value === null || value === undefined || value === '') {
        return []
    }

    return [String(value)]
}
