import type { AxiosResponse } from 'axios'

export const cache: Map<string, AxiosResponse & { expiredTime: number }> = new Map()
