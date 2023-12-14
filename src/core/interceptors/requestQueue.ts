/**
 * @name 请求队列拦截器
 */
import type { AxiosInterceptorOptions, AxiosResponse } from 'axios'
import type { RequestInterceptor, SuperRequestConfig } from '../instance'
import { createMatcher, uuid } from '../helpers'

export interface SuperRequestQuequeOptions {
  maxCount?: number
  include?: string[]
  exclude?: string[]
  axiosInterceptorOptions?: AxiosInterceptorOptions
}

export const queue: Map<
  string,
  {
    queueKey: string
    resolve: (value: AxiosResponse) => void
    reject: (reason?: any) => void
    config: SuperRequestConfig
  }
> = new Map()
export const snning = new Set<string>()

export function requestQueue(options: SuperRequestQuequeOptions = {}): RequestInterceptor {
  return {
    onFulfilled(config) {
      const matcher = createMatcher(options.include, options.exclude)
      if (!matcher(config.method ?? '', config.url ?? '')) {
        return config
      }

      if (!options.maxCount || options.maxCount >= Number.MAX_SAFE_INTEGER) return config

      return new Promise((resolve, reject) => {
        const key = uuid()
        config.headers = config.headers || {}
        config.headers['X-Request-Queue-Key'] = key

        queue.set(key, {
          queueKey: key,
          resolve,
          reject,
          config
        })

        // if (snning.size < options.maxCount) {
        //   snning.add(key)
        // }
        // TODO: 再次发起请求需要携带额外参数跳过此拦截器
        // TODO: 存储在待请求队列时使用的是 config，而不是 promise
        // TODO: 如何在一个请求拦截中定义响应拦截
      })
    },
    onRejected(error) {
      return Promise.reject(error)
    },
    options: options.axiosInterceptorOptions
  }
}
