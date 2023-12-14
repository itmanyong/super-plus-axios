/**
 * @name 请求缓存拦截器
 */
import type { AxiosInterceptorOptions, AxiosResponse } from 'axios'
import type { RequestInterceptor } from '../instance'
import { createMatcher } from '../helpers'
import { cache } from './common'

export interface SuperRequestCacheOptions {
  include?: string[]
  exclude?: string[]
  axiosInterceptorOptions?: AxiosInterceptorOptions
}

export function requestCache(options: SuperRequestCacheOptions = {}): RequestInterceptor {
  return {
    onFulfilled(config) {
      const matcher = createMatcher(options.include, options.exclude)
      const { method, url } = config
      if (!matcher(method ?? '', url ?? '')) return config

      const cacheKey = `${method}_${url}`

      if (cache.has(cacheKey)) {
        const cacheResponse = cache.get(cacheKey)
        if (cacheResponse) {
          const now = Date.now()
          const { expiredTime, ...cacheOtherResponse } = cacheResponse
          if (expiredTime >= now) {
            config.adapter = () => {
              const response: AxiosResponse<any, any> = {
                ...cacheOtherResponse,
                headers: config.headers,
                config,
                request: {},
                data: cacheOtherResponse.data,
                status: cacheOtherResponse.status ?? 200,
                statusText: cacheOtherResponse.statusText ?? 'OK'
              }
              return Promise.resolve(response)
            }
          } else {
            cache.delete(cacheKey)
          }
        }
      }

      return config
    },
    onRejected(error) {
      return Promise.reject(error)
    },
    options: options.axiosInterceptorOptions
  }
}
