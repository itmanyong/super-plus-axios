import { minimatch } from 'minimatch'
/**
 * @desc 唯一标识符
 * @return {String}
 */
export const uuid = (): string => Math.random().toString(36).substring(2)
/**
 * @desc 是否是浏览器环境
 * @return {Boolean}
 */
export const isBrowser = (): boolean => ![typeof window, typeof document].includes('undefined')
/**
 * @desc 是否是函数
 * @param  fn 需要判定的值
 * @return {Boolean}
 */
export const isFunction = (fn: unknown): fn is Function => typeof fn === 'function'
/**
 * 是否是真对象
 * @param obj 需要判定的值
 * @returns {Boolean}
 */
export const isPlainObject = (obj: unknown): obj is Record<string, any> =>
  Object.prototype.toString.call(obj) === '[object Object]'
/**
 * 是否匹配指定的正则表达式
 * @param pattern 正则表达式
 * @param method 方法
 * @param url 请求地址
 * @returns {Boolean} 是否匹配
 */
export function matchPattern(pattern: string, method: string, url: string) {
  return pattern.startsWith('method:') ? pattern.replace('method:', '').trim() === method : minimatch(url ?? '', pattern)
}
/**
 * 创建匹配器
 * @param include 匹配规则
 * @param exclude 排除规则
 * @returns {Function} 匹配器
 */
export function createMatcher(include?: string[], exclude?: string[]) {
  function matcher(method: string, url: string) {
    if (!include && !exclude) {
      return true
    }

    const isExclude = (exclude ?? []).some(pattern => matchPattern(pattern, method, url))

    if (isExclude) {
      return false
    }

    if (!include) {
      return true
    }

    const isInclude = (include ?? []).some(pattern => matchPattern(pattern, method, url))

    return isInclude
  }

  return matcher
}

