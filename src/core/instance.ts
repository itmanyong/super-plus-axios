import axios from 'axios'
import qs from 'qs'
import stringify from 'fast-json-stable-stringify'
import type {
  AxiosInstance,
  AxiosInterceptorOptions,
  AxiosRequestHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  InternalAxiosRequestConfig
} from 'axios'
import { isBrowser } from './helpers'

export const CONTENT_TYPE = {
  JSON: 'application/json;charset=utf-8',
  TEXT: 'text/plain;charset=utf-8',
  FORM: 'application/x-www-form-urlencoded;charset=utf-8',
  HTML: 'text/html;charset=utf-8',
  FORM_DATA: 'multipart/form-data;charset=utf-8'
} as const

export const RESPONSE_TYPE = {
  JSON: 'json',
  TEXT: 'text',
  BLOB: 'blob',
  BUFFER: 'arraybuffer',
  DOCUMENT: 'document',
  STREAM: 'stream'
} as const

export const FetchMethod = ['get', 'head', 'options'] as const
export const ModifyMethod = ['post', 'put', 'delete', 'patch'] as const

export type SuperContentType = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE]
export type SuperResponseType = (typeof RESPONSE_TYPE)[keyof typeof RESPONSE_TYPE]
export type SuperFetchMethod = (typeof FetchMethod)[number]
export type SuperModifyMethod = (typeof ModifyMethod)[number]

export type SuperRequestConfig = AxiosRequestConfig & {}

export type SuperParams = {
  query?: Record<string, string> | undefined
  param?: Record<string, any> | undefined
  data?: any
}

export type SuperFetchRunner = <T = any, K = AxiosResponse<T>>(
  url: string,
  params?: SuperParams,
  config?: SuperRequestConfig
) => Promise<K>

export type SuperModifyRunner = <T = any, K = AxiosResponse<T>>(
  url: string,
  params?: SuperParams,
  config?: SuperRequestConfig
) => Promise<K>

export interface Interceptor<V> {
  onFulfilled?: ((value: V) => any) | null
  onRejected?: ((error: any) => any) | null
  options?: AxiosInterceptorOptions
}

export type RequestInterceptor = Interceptor<InternalAxiosRequestConfig>
export type ResponseInterceptor<V = AxiosResponse<any, any>> = Interceptor<V>

export type SuperInstance = {
  instance: AxiosInstance
  // util
  getHeaders(): HeadersDefaults['common']
  setHeader(key: string, value: string): void
  deleteHeader(key: string | string[]): void

  useRequestInterceptor(...interceptors: RequestInterceptor[]): void
  useResponseInterceptor(...interceptors: ResponseInterceptor[]): void
  // fetch
  get: SuperFetchRunner
  getJson: SuperFetchRunner
  getText: SuperFetchRunner
  getBlob: SuperFetchRunner
  getStream: SuperFetchRunner
  getBuffer: SuperFetchRunner
  getDocument: SuperFetchRunner

  head: SuperFetchRunner
  headJson: SuperFetchRunner
  headText: SuperFetchRunner
  headBlob: SuperFetchRunner
  headStream: SuperFetchRunner
  headBuffer: SuperFetchRunner
  headDocument: SuperFetchRunner

  options: SuperFetchRunner
  optionsJson: SuperFetchRunner
  optionsText: SuperFetchRunner
  optionsBlob: SuperFetchRunner
  optionsStream: SuperFetchRunner
  optionsBuffer: SuperFetchRunner
  optionsDocument: SuperFetchRunner
  // modify
  post: SuperModifyRunner
  postJson: SuperModifyRunner
  postText: SuperModifyRunner
  postHtml: SuperModifyRunner
  postForm: SuperModifyRunner
  postFormData: SuperModifyRunner
  postStream: SuperModifyRunner

  put: SuperModifyRunner
  putJson: SuperModifyRunner
  putText: SuperModifyRunner
  putHtml: SuperModifyRunner
  putForm: SuperModifyRunner
  putFormData: SuperModifyRunner
  putStream: SuperModifyRunner

  delete: SuperModifyRunner
  deleteJson: SuperModifyRunner
  deleteText: SuperModifyRunner
  deleteHtml: SuperModifyRunner
  deleteForm: SuperModifyRunner
  deleteFormData: SuperModifyRunner
  deleteStream: SuperModifyRunner
  del: SuperModifyRunner
  delJson: SuperModifyRunner
  delText: SuperModifyRunner
  delHtml: SuperModifyRunner
  delForm: SuperModifyRunner
  delFormData: SuperModifyRunner
  delStream: SuperModifyRunner

  patch: SuperModifyRunner
  patchJson: SuperModifyRunner
  patchText: SuperModifyRunner
  patchHtml: SuperModifyRunner
  patchForm: SuperModifyRunner
  patchFormData: SuperModifyRunner
  patchStream: SuperModifyRunner

  // extend
  dowload: (downloadURL: string, filename?: string) => boolean
  getUrl: (path: string, params?: SuperParams, contentType?: SuperContentType) => [string, any]
}

function handleParams(options: Record<string, any>, params?: SuperParams) {
  if (!params) return options
  const { query, param, data } = params
  if (query) {
    options.url += `?${qs.stringify(query)}`
  }
  if (param) {
    options.url = options.url.replace(/:(\w+)|{(\w+)}/g, (_: string, key: string) => param[key] || key)
  }
  if (ModifyMethod.includes(options.method) && data) {
    switch (options.headers['Content-Type']) {
      case CONTENT_TYPE.JSON:
        break
      case CONTENT_TYPE.FORM:
        options.data = qs.stringify(data)
        break

      case CONTENT_TYPE.FORM_DATA:
        const formData = new FormData()
        Object.keys(data).forEach(key => formData.append(key, data[key]))
        options.data = formData
        break

      case CONTENT_TYPE.TEXT:
        options.data = ['string', 'number', 'boolean'].includes(typeof data) ? data : stringify(data)
        break
    }
    options.data = data
  }

  options.args = params

  return options
}

function createFetchRunner(instance: AxiosInstance, method: SuperFetchMethod, responseType: SuperResponseType) {
  return function <T, A = AxiosResponse<T>>(url: string, params?: SuperParams, config?: SuperRequestConfig): Promise<A> {
    const options = {
      url,
      method,
      responseType,
      ...config
    }
    handleParams(options, params)
    return instance(options)
  }
}

function createModifyRunner(instance: AxiosInstance, method: SuperModifyMethod, contentType: SuperContentType) {
  return function <T, R = AxiosResponse<T>>(url: string, params?: any, config?: SuperRequestConfig): Promise<R> {
    const options = {
      url,
      method,
      headers: {
        'Content-Type': contentType
      },
      ...config
    }
    handleParams(options, params)
    return instance(options)
  }
}

function aliasSaveAs(instance: SuperInstance, method: SuperFetchMethod | SuperModifyMethod, aliasName: string) {
  Object.entries(instance).forEach(([key, value]) => {
    if (new RegExp(`^${method}`).test(key)) {
      const newKey = key.replace(method, aliasName) as keyof SuperInstance
      ;(instance as any)[newKey] = value
    }
  })
}

export function download(downloadURL: string | Blob, filename?: string) {
  if (!isBrowser()) return false
  const tagA = document.createElement('a')
  tagA.download = filename || `download-${new Date().toLocaleString().replace(/ /g, '-')}-${Date.now()}`
  tagA.style.display = 'none'
  tagA.href = typeof downloadURL === 'string' ? downloadURL : URL.createObjectURL(downloadURL)
  document.body.appendChild(tagA)
  tagA.click()
  URL.revokeObjectURL(tagA.href)
  document.body.removeChild(tagA)
}

export function createSuperAxios(config: AxiosRequestConfig = {}): SuperInstance {
  const instance = axios.create(config)

  const getHeaders = () => instance.defaults.headers.common as AxiosRequestHeaders

  const setHeader = (key: string, value: string | number | boolean) => {
    ;(instance.defaults.headers.common as AxiosRequestHeaders)[key] = value
  }

  const deleteHeader = (key: string | string[]) => {
    if (typeof key === 'string') {
      Reflect.deleteProperty(instance.defaults.headers.common as AxiosRequestHeaders, key)
      return
    }

    key.forEach(k => Reflect.deleteProperty(instance.defaults.headers.common as AxiosRequestHeaders, k))
  }

  const getUrl = (path: string, params?: SuperParams, contentType?: SuperContentType) => {
    const ct =
      contentType || CONTENT_TYPE[(config?.headers?.['Content-Type'] || 'JSON').toUpperCase() as keyof typeof CONTENT_TYPE]
    const { url, data } = handleParams({ url: path, headers: { 'Content-Type': ct } }, params) || {}
    return [url, data]
  }

  const useRequestInterceptor = (...interceptors: RequestInterceptor[]) => {
    interceptors.forEach(interceptor => {
      instance.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected, interceptor.options)
    })
  }

  const useResponseInterceptor = (...interceptors: ResponseInterceptor[]) => {
    interceptors.forEach(interceptor => {
      instance.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected, interceptor.options)
    })
  }

  const result = {
    instance,
    getHeaders,
    setHeader,
    deleteHeader,
    useRequestInterceptor,
    useResponseInterceptor,
    ...FetchMethod.map(method => {
      return {
        [method]: createFetchRunner(
          instance,
          method,
          RESPONSE_TYPE[(config?.responseType || 'JSON').toUpperCase() as keyof typeof RESPONSE_TYPE]
        ),
        [`${method}Json`]: createFetchRunner(instance, method, RESPONSE_TYPE.JSON),
        [`${method}Text`]: createFetchRunner(instance, method, RESPONSE_TYPE.TEXT),
        [`${method}Blob`]: createFetchRunner(instance, method, RESPONSE_TYPE.BLOB),
        [`${method}Stream`]: createFetchRunner(instance, method, RESPONSE_TYPE.STREAM),
        [`${method}Buffer`]: createFetchRunner(instance, method, RESPONSE_TYPE.BUFFER),
        [`${method}Document`]: createFetchRunner(instance, method, RESPONSE_TYPE.DOCUMENT)
      }
    }),
    ...ModifyMethod.map(method => {
      return {
        [method]: createModifyRunner(
          instance,
          method,
          CONTENT_TYPE[(config?.headers?.['Content-Type'] || 'JSON').toUpperCase() as keyof typeof CONTENT_TYPE]
        ),
        [`${method}Json`]: createModifyRunner(instance, method, CONTENT_TYPE.JSON),
        [`${method}Text`]: createModifyRunner(instance, method, CONTENT_TYPE.TEXT),
        [`${method}Html`]: createModifyRunner(instance, method, CONTENT_TYPE.HTML),
        [`${method}Form`]: createModifyRunner(instance, method, CONTENT_TYPE.FORM),
        [`${method}FormData`]: createModifyRunner(instance, method, CONTENT_TYPE.FORM_DATA),
        [`${method}Stream`]: createModifyRunner(instance, method, CONTENT_TYPE.FORM_DATA)
      }
    }),
    download,
    getUrl
  }

  // 别名
  aliasSaveAs(result as unknown as SuperInstance, 'delete', 'del')

  return result as unknown as SuperInstance
}
