

// 添加类型声明
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 请求配置接口
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
  timeout?: number
}

// 响应数据接口
export interface ResponseData<T = any> {
  code: number
  message: string
  data?: T
  error?: string
}

// 请求拦截器
export const requestInterceptor = (config: RequestConfig): RequestConfig => {
  // 添加认证token
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 添加Content-Type
  if (!config.headers?.['Content-Type'] && config.data) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json'
    }
  }
  
  return config
}

// 响应拦截器
export const responseInterceptor = async (response: Response): Promise<ResponseData> => {
  try {
    // 检查响应内容类型
    const contentType = response.headers.get('content-type')
    let data
    
    // 只有当响应是JSON格式时才解析为JSON
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // 对于非JSON响应，尝试获取文本内容
      const text = await response.text()
      // 如果文本为空，返回空对象
      data = text ? { message: text } : {}
    }
    
    // 处理HTTP 401错误（认证失败）
    if (response.status === 401) {
      // 清除无效token
      localStorage.removeItem('admin_token')
      throw new Error(data.message || data.error || '认证失败，请重新登录')
    }
    
    // 处理HTTP 403错误（权限不足）
    if (response.status === 403) {
      // 清除无效token
      localStorage.removeItem('admin_token')
      // 跳转到登录页面
      window.location.href = '/login'
      throw new Error('权限验证失败，请重新登录')
    }
    
    // 处理其他业务错误 - 只有当HTTP状态码不是2xx时才抛出错误
    if (!response.ok) {
      throw new Error(data.message || data.error || '请求失败')
    }
    
    return data
  } catch (error) {
    // 处理网络错误或解析错误
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error('请求失败，请稍后重试')
    }
  }
}

// 错误处理函数
export const handleError = (error: any): never => {
  let errorMessage = '请求失败，请稍后重试'
  
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }
  
  // 直接抛出错误，由调用者处理
  throw new Error(errorMessage)
}

// 基础请求函数
export const request = async <T = any>(config: RequestConfig): Promise<T> => {
  try {
    // 应用请求拦截器
    const processedConfig = requestInterceptor(config)
    
    const response = await fetch(`${API_BASE_URL}${processedConfig.url}`, {
      method: processedConfig.method || 'GET',
      headers: processedConfig.headers,
      body: processedConfig.data ? JSON.stringify(processedConfig.data) : undefined,
      signal: processedConfig.timeout ? AbortSignal.timeout(processedConfig.timeout) : undefined
    })
    
    // 应用响应拦截器
    const data = await responseInterceptor(response)
    
    // 返回完整的响应数据，包括分页信息
    return data as T
  } catch (error) {
    return handleError(error)
  }
}

// GET请求
export const get = <T = any>(url: string, params?: Record<string, any>): Promise<T> => {
  // 处理查询参数
  const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
  return request<T>({
    url: `${url}${queryString}`,
    method: 'GET'
  })
}

// POST请求
export const post = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data
  })
}

// PUT请求
export const put = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data
  })
}

// DELETE请求
export const del = <T = any>(url: string): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE'
  })
}

// 导出API工具
export default {
  get,
  post,
  put,
  delete: del
}
