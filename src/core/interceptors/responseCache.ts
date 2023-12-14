/**
 * @name 响应缓存拦截器
 * @description 放置在改变响应数据格式的拦截器前面，默认缓存时间为 1024 * 30 ms
 */
import type { AxiosInterceptorOptions, AxiosResponse } from 'axios'
import type { ResponseInterceptor } from '../instance'
import { createMatcher, matchPattern } from '../helpers'
import { cache } from './common'

export interface SuperResponseCacheOptions {
  freshTime?: number
  freshTimeMappping?: Record<string, number>
  include?: string[]
  exclude?: string[]
  axiosInterceptorOptions?: AxiosInterceptorOptions
}

export function responseCache(options: SuperResponseCacheOptions = {}): ResponseInterceptor {
  return {
    onFulfilled(response) {
      const matcher = createMatcher(options.include, options.exclude)
      const { method, url } = response.config
      if (!matcher(method ?? '', url ?? '')) return response

      const cacheKey = `${method}_${url}`
      let freshTime = options.freshTime ?? 1024 * 30
      if (options.freshTimeMappping) {
        const [, mappingValue] =
          Object.entries(options.freshTimeMappping ?? {}).find(([key, value]) =>
            matchPattern(key, method || 'get', url || '')
          ) || []
        freshTime = mappingValue ?? freshTime
      }

      cache.set(cacheKey, {
        expiredTime: Date.now() + freshTime,
        ...response
      })

      return response
    },
    onRejected(error) {
      return Promise.reject(error)
    },
    options: options.axiosInterceptorOptions
  }
}
