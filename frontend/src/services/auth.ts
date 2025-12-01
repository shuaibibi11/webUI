import api from './api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  SendSmsRequest, 
  AuthResponse, 
  User 
} from '../types';

class AuthService {
  // 用户登录
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<{ token?: string; user?: User; message?: string }>('/users/login', data, { withCredentials: true });
    const mapped: AuthResponse = {
      success: Boolean(res?.token && res?.user),
      message: res?.message || '登录成功',
      data: res?.token && res?.user ? { token: res.token as string, user: res.user as User } : undefined,
    };
    if (mapped.success && mapped.data) {
      sessionStorage.setItem('access_token', mapped.data.token);
      sessionStorage.setItem('user_info', JSON.stringify(mapped.data.user));
      api.setToken(mapped.data.token);
      localStorage.setItem('user_info', JSON.stringify(mapped.data.user));
    }
    return mapped;
  }
  
  // 用户注册
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<{ user?: User; message?: string }>('/users/register', data);
    const mapped: AuthResponse = {
      success: Boolean(res?.user),
      message: res?.message || '注册成功',
      data: res?.user ? { token: '', user: res.user as User } : undefined,
    };
    return mapped;
  }
  
  // 发送短信验证码
  async sendSms(data: SendSmsRequest): Promise<{
    success: boolean;
    message: string;
    data?: { expireTime: number };
  }> {
    const response = await api.post<{ success: boolean; message: string; data?: { expireTime: number } }>('/auth/send-sms', data);
    return response;
  }
  
  // 刷新Token
  async refreshToken(): Promise<{ success: boolean; data?: { token: string } }> {
    const response = await api.post<{ success: boolean; data?: { token: string } }>('/auth/refresh');
    if (response.success && response.data?.token) {
      api.setToken(response.data.token);
    }
    return response;
  }
  
  // 用户登出
  async logout(): Promise<void> {
    await api.post<{ success: boolean }>('/auth/logout').catch(() => { /* ignore */ });
    this.clearAuthData();
  }
  
  // 获取当前用户信息
  getCurrentUser(): User | null {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) as User : null;
  }
  
  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = api.getCurrentToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }
  
  // 更新用户信息
  updateUser(user: User): void {
    localStorage.setItem('user_info', JSON.stringify(user));
  }
  
  // 清除认证数据
  clearAuthData(): void {
    api.clearToken();
    localStorage.removeItem('user_info');
    sessionStorage.clear();
  }
  
  // 获取Token
  getToken(): string | null {
    return api.getCurrentToken();
  }
  
  // 设置Token（用于测试或特殊场景）
  setToken(token: string): void {
    api.setToken(token);
  }
  
  // 验证Token是否即将过期
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number };
    const exp = payload.exp * 1000;
    const now = Date.now();
    const timeUntilExpiry = exp - now;
    return timeUntilExpiry < 60 * 60 * 1000;
  }
  
  // 自动刷新Token
  async autoRefreshToken(): Promise<boolean> {
    if (!this.isTokenExpiringSoon()) {
      return true;
    }
    const response = await this.refreshToken();
    return response.success;
  }
}

// 创建认证服务实例
export const authService = new AuthService();

// 默认导出
export default authService;
