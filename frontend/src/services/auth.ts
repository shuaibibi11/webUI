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
    try {
      const res = await api.post<any>('/users/login', data, { withCredentials: true });
      const mapped: AuthResponse = {
        success: Boolean(res?.token && res?.user),
        message: res?.message || '登录成功',
        data: res?.token && res?.user ? { token: res.token as string, user: res.user as User } : undefined,
      };
      if (mapped.success && mapped.data) {
        // 每次登录写入当前会话的 sessionStorage，避免同浏览器多账号串联
        sessionStorage.setItem('access_token', mapped.data.token);
        sessionStorage.setItem('user_info', JSON.stringify(mapped.data.user));
        // 仍写入 localStorage 作为备份，但以 sessionStorage 优先读取
        api.setToken(mapped.data.token);
        localStorage.setItem('user_info', JSON.stringify(mapped.data.user));
      }
      return mapped;
    } catch (error) {
      throw error;
    }
  }
  
  // 用户注册
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const res = await api.post<any>('/users/register', data);
      const mapped: AuthResponse = {
        success: Boolean(res?.user),
        message: res?.message || '注册成功',
        // 注册接口不返回token，这里仅回传用户信息，token留空字符串以便页面逻辑可用
        data: res?.user ? { token: '', user: res.user as User } : undefined,
      };
      return mapped;
    } catch (error) {
      throw error;
    }
  }
  
  // 发送短信验证码
  async sendSms(data: SendSmsRequest): Promise<{
    success: boolean;
    message: string;
    data?: { expireTime: number };
  }> {
    try {
      const response = await api.post('/auth/send-sms', data);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // 刷新Token
  async refreshToken(): Promise<{ success: boolean; data?: { token: string } }> {
    try {
      const response = await api.post('/auth/refresh');
      
      if (response.success && response.data?.token) {
        api.setToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // 用户登出
  async logout(): Promise<void> {
    try {
      // 可选：调用后端登出接口
      await api.post('/auth/logout').catch(() => {
        // 忽略登出接口错误
      });
    } catch (error) {
      // 忽略错误
    } finally {
      // 清除本地存储
      this.clearAuthData();
    }
  }
  
  // 获取当前用户信息
  getCurrentUser(): User | null {
    try {
      const userInfo = localStorage.getItem('user_info');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  // 检查是否已登录
  isAuthenticated(): boolean {
    try {
      const token = api.getCurrentToken();
      const user = this.getCurrentUser();
      return !!(token && user);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
  
  // 更新用户信息
  updateUser(user: User): void {
    try {
      localStorage.setItem('user_info', JSON.stringify(user));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }
  
  // 清除认证数据
  clearAuthData(): void {
    try {
      api.clearToken();
      localStorage.removeItem('user_info');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
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
    try {
      const token = this.getToken();
      if (!token) return true;
      
      // 简单的JWT token过期检查
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      
      // 如果token将在1小时内过期，则认为即将过期
      return timeUntilExpiry < 60 * 60 * 1000;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }
  
  // 自动刷新Token
  async autoRefreshToken(): Promise<boolean> {
    try {
      if (!this.isTokenExpiringSoon()) {
        return true;
      }
      
      const response = await this.refreshToken();
      return response.success;
    } catch (error) {
      console.error('Error auto refreshing token:', error);
      return false;
    }
  }
}

// 创建认证服务实例
export const authService = new AuthService();

// 默认导出
export default authService;
