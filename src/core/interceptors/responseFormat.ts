/**
 * @name 响应数据格式转换拦截器
 * @description 需要放在最后一个拦截器，因为它会改变响应数据的格式
 */
import type { AxiosInterceptorOptions, AxiosResponse } from 'axios'
import type { ResponseInterceptor } from '../instance'
import { createMatcher, matchPattern } from '../helpers'

export interface SuperResponseFormatOptions {
  mapping?: Record<string, (response: AxiosResponse) => any | void>
  include?: string[]
  exclude?: string[]
  axiosInterceptorOptions?: AxiosInterceptorOptions
}

export function responseFormat(options: SuperResponseFormatOptions = {}): ResponseInterceptor {
  return {
    onFulfilled(response) {
      const matcher = createMatcher(options.include, options.exclude)
      const { url, method } = response.config
      if (!matcher(method ?? '', url ?? '')) return response

      const findMappingRecord = () =>
        Object.entries(options.mapping ?? {}).find(([key, value]) => matchPattern(key, method || 'get', url || ''))

      const mappingRecord = findMappingRecord()
      if (!mappingRecord) {
        return response
      }

      const [, mappingValue] = mappingRecord

      const result = mappingValue(response) || response

      return result
    },
    onRejected(error) {
      return Promise.reject(error)
    },
    options: options.axiosInterceptorOptions
  }
}
