/**
 * @name 请求头拦截器
 */
import type { AxiosInterceptorOptions } from 'axios'
import type { RequestInterceptor } from '../instance'
import { createMatcher, isFunction } from '../helpers'

export interface SuperRequestHeadersOptions {
  headers?: Record<string, string> | (() => Record<string, string>)
  include?: string[]
  exclude?: string[]
  axiosInterceptorOptions?: AxiosInterceptorOptions
}

export function requestHeaders(options: SuperRequestHeadersOptions = {}): RequestInterceptor {
  const { headers: headersOrGetter } = options

  return {
    onFulfilled(config) {
      const matcher = createMatcher(options.include, options.exclude)
      if (!matcher(config.method ?? '', config.url ?? '')) {
        return config
      }

      const headers = (isFunction(headersOrGetter) ? headersOrGetter() : headersOrGetter) ?? {}

      Object.entries(headers).forEach(([key, value]) => {
        config.headers[key] = value
      })

      return config
    },
    onRejected(error) {
      return Promise.reject(error)
    },
    options: options.axiosInterceptorOptions
  }
}
