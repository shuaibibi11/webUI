import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { authService } from '../../services/auth';
import { useAppStore } from '../../stores';

const loginSchema = z.object({
  identifier: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  agreeTerms: z.boolean().refine((v)=>v===true,'请阅读并同意《服务条款》'),
  agreePrivacy: z.boolean().refine((v)=>v===true,'请阅读并同意《隐私政策》'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'username' | 'phone'>('username');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser, setAuthenticated } = useAppStore();
  const isAuthed = useAppStore(state => state.isAuthenticated);

  // 登录页不做自动重定向，确保每次访问都显示全新的登录页面

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
      agreeTerms: false,
      agreePrivacy: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        username: data.identifier,
        password: data.password
      });

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setAuthenticated(true);
        
        toast({
          title: '登录成功',
          description: '欢迎回来！',
        });
        
        navigate('/chat', { replace: true });
        if (typeof window !== 'undefined') {
          window.location.href = '/chat';
        }
      }
    } catch (error: any) {
      const msg = error?.message || '用户名或密码错误，请重试。';
      if (msg.includes('账号未审批')) {
        toast({ variant: 'destructive', title: '待审批', description: '您的账号尚未通过审核，请联系管理员或稍后重试。' });
      } else {
        toast({ variant: 'destructive', title: '登录失败', description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 监听登录状态，成功并且存在令牌时跳转聊天页，避免无令牌循环跳转导致空白
  useEffect(() => {
    const token = authService.getToken();
    if (isAuthed && token) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthed, navigate]);

  return (
    <div className="container-auth">
      <div className="w-full max-w-md space-y-8">
        {/* Logo和标题 */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded bg-primary-600 flex items-center justify-center text-white">
            <User className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-secondary-900">
            和元智擎
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            便捷、灵活、可靠的企业级大模型应用开发平台
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* 登录方式切换 */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                type="button"
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  loginType === 'username'
                    ? "bg-primary-50 text-primary-700"
                    : "text-secondary-600 hover:text-secondary-900"
                )}
                onClick={() => setLoginType('username')}
              >
                账号登录
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  loginType === 'phone'
                    ? "bg-primary-50 text-primary-700"
                    : "text-secondary-600 hover:text-secondary-900"
                )}
                onClick={() => setLoginType('phone')}
              >
                手机登录
              </button>
            </div>

            <div className="space-y-4">
              {/* 账号/手机号输入 */}
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  {loginType === 'username' ? '用户名/邮箱' : '手机号码'}
                </label>
                <div className="mt-1">
                  <input
                    id="identifier"
                    type={loginType === 'username' ? 'text' : 'tel'}
                    className={cn(
                      "input",
                      errors.identifier && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder={loginType === 'username' ? '请输入用户名或邮箱' : '请输入11位手机号码'}
                    {...register('identifier')}
                  />
                  {errors.identifier && (
                    <p className="form-error">{errors.identifier.message}</p>
                  )}
                </div>
              </div>

              {/* 密码输入 */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  密码
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                      "input pr-10",
                      errors.password && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="请输入密码"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  {...register('remember')}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-secondary-900">
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <Link to="/password-reset" className="font-medium text-primary-600 hover:text-primary-500">忘记密码？</Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <input id="agreeTerms" type="checkbox" className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" {...register('agreeTerms')} />
                <label htmlFor="agreeTerms" className="ml-2 text-sm text-secondary-500">我已阅读并同意 <a href="/terms" className="font-medium text-primary-600 hover:text-primary-500 mx-1">《服务条款》</a></label>
              </div>
              {errors.agreeTerms && <p className="form-error text-xs">{errors.agreeTerms.message}</p>}
              <div className="flex items-start">
                <input id="agreePrivacy" type="checkbox" className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" {...register('agreePrivacy')} />
                <label htmlFor="agreePrivacy" className="ml-2 text-sm text-secondary-500">我已阅读并同意 <a href="/privacy" className="font-medium text-primary-600 hover:text-primary-500 mx-1">《隐私政策》</a></label>
              </div>
              {errors.agreePrivacy && <p className="form-error text-xs">{errors.agreePrivacy.message}</p>}
            </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary flex justify-center py-2.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登 录'
                )}
              </button>
            </div>
          </form>

          {/* 注册链接 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-secondary-500">
                  没有账号？
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                立即注册
              </Link>
            </div>
          </div>
        </div>

        {/* 版本号 */}
        <p className="text-center text-xs text-secondary-400">
          v1.3.1
        </p>
      </div>
    </div>
  );
}
