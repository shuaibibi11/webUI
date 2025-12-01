import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { ERROR_CODES, type ApiResponse } from '../types';

const API_CONFIG = {
  baseURL: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? ((import.meta as unknown as { env?: Record<string, string> }).env?.DEV ? '/api' : 'http://localhost:3003/api'),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
};

// 创建axios实例
class ApiService {
  private instance: AxiosInstance;
  
  constructor() {
    this.instance = axios.create(API_CONFIG);
    this.instance.defaults.withCredentials = true;
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error: AxiosError<ApiResponse>) => {
        return this.handleError(error);
      }
    );
  }
  
  private getToken(): string | null {
    try {
      const session = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
      if (session) return session;
      const local = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (local) return local;
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
  
  private handleError(error: AxiosError<ApiResponse>): Promise<never> {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      const payload = data as ApiResponse | undefined;
      const msg = payload?.error || payload?.message || `HTTP ${status}`;
      if (status === 401) this.handleTokenExpired();
      console.error('API Error:', msg);
      return Promise.reject({ success: false, message: msg, errorCode: ERROR_CODES.INTERNAL_ERROR });
    } else if (error.request) {
      // 请求未得到响应
      return Promise.reject({
        success: false,
        message: '网络连接失败，请检查网络连接',
        errorCode: ERROR_CODES.INTERNAL_ERROR,
      });
    } else {
      // 请求配置错误
      return Promise.reject({
        success: false,
        message: '请求配置错误',
        errorCode: ERROR_CODES.INTERNAL_ERROR,
      });
    }
  }
  
  private handleTokenExpired(): void {
    // 清除本地存储的token
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    
    // 跳转到登录页面
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=true';
    }
  }
  
  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data as T;
  }
  
  // POST请求
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data as T;
  }
  
  // PUT请求
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data as T;
  }
  
  // DELETE请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data as T;
  }
  
  // 上传文件
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // 设置token
  setToken(token: string): void {
    try {
      localStorage.setItem('access_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }
  
  // 清除token
  clearToken(): void {
    try {
      localStorage.removeItem('access_token');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }
  
  // 获取当前token
  getCurrentToken(): string | null {
    return this.getToken();
  }
}

// 创建API服务实例
export const api = new ApiService();

// 默认导出
export default api;
