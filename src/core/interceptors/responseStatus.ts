/**
 * @name 响应状态拦截器
 */
import type { AxiosInterceptorOptions, AxiosResponse } from 'axios'
import type { ResponseInterceptor } from '../instance'
import { createMatcher } from '../helpers'

export interface SuperResponseStatusOptions {
  successHandler?: Record<number | string, (response: AxiosResponse<any, any>) => any>
  errorHandler?: Record<number | string, (error: any) => any>
  include?: string[]
  exclude?: string[]
  axiosInterceptorOptions?: AxiosInterceptorOptions
}

export function responseStatus(options: SuperResponseStatusOptions = {}): ResponseInterceptor {
  return {
    onFulfilled(response) {
      const matcher = createMatcher(options.include, options.exclude)
      if (!matcher(response.config.method ?? '', response.config.url ?? '')) {
        return response
      }

      const handler = (options.successHandler ?? {})[response.status]
      if (!handler) {
        return response
      }

      const handlerResponse = handler(response)

      return handlerResponse ?? response
    },
    onRejected(error) {
      const matcher = createMatcher(options.include, options.exclude)
      if (!matcher(error.config.method ?? '', error.config.url ?? '')) {
        return Promise.reject(error)
      }

      const handler = (options.errorHandler ?? {})[error.response.status]
      if (!handler) {
        return Promise.reject(error)
      }

      const handlerError = handler(error)
      return handlerError ?? Promise.reject(error)
    },
    options: options.axiosInterceptorOptions
  }
}
