import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

import { authService } from '../../services/auth';
import { useAppStore } from '../../stores';

// 密码强度验证正则
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&_]{8,20}$/;

const registerSchema = z.object({
  username: z.string()
    .min(4, '用户名至少4位')
    .max(20, '用户名最多20位')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的11位手机号码'),
  realName: z.string()
    .regex(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, '姓名只能包含中文、英文和空格')
    .min(2, '请输入真实姓名')
    .max(50, '姓名长度不超过50'),
  idCard: z.string().regex(/^[0-9Xx]{15,18}$/i, '请输入有效的身份证号码'),
  password: z.string().regex(passwordRegex, '密码需包含大小写字母、数字及特殊字符（@$!%*?&_），长度8-20位'),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((val) => val === true, '请阅读并同意服务条款'),
  agreePrivacy: z.boolean().refine((val) => val === true, '请阅读并同意隐私政策'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // 删除验证码相关状态
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser, setAuthenticated } = useAppStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreeTerms: false,
      agreePrivacy: false,
    },
  });

  const password = watch('password');
  // 仅用于动态展示的订阅可移除避免未使用警告

  // 监听密码变化计算强度
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&_]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // 删除手机验证码逻辑（倒计时与发送按钮不再显示）

  // 删除手机验证码逻辑

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        username: data.username,
        phone: data.phone,
        password: data.password,
        email: `${data.username}@example.com`,
        realName: data.realName,
        idCard: data.idCard
      });

      if (response.success) {
        const loginRes = await authService.login({
          username: data.username,
          password: data.password
        });

        if (loginRes.success && loginRes.data?.user) {
          setUser(loginRes.data.user);
          setAuthenticated(true);
          toast({ title: '注册成功', description: '已为您自动登录' });
          navigate('/chat');
          return;
        }

        toast({ title: '注册成功', description: '请使用账号密码登录' });
        navigate('/login');
        return;
      }
    } catch (error) {
      const msg = (error as { message?: string })?.message || '请检查填写信息是否符合要求';
      toast({
        variant: 'destructive',
        title: '注册失败',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (level: number) => {
    if (level === 0) return 'bg-secondary-200';
    if (level <= 2) return 'bg-red-500';
    if (level <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (level: number) => {
    if (level === 0) return '';
    if (level <= 2) return '弱';
    if (level <= 4) return '中';
    return '强';
  };

  return (
    <div className="container-auth">
        {/* 添加返回按钮 */}
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="absolute top-4 left-4 flex items-center text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        <span className="text-sm font-medium">返回</span>
      </button>
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded bg-primary-600 flex items-center justify-center text-white">
            <UserPlus className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-secondary-900">
            创建新账号
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            加入和元智擎，开启企业级AI应用开发之旅
          </p>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* 用户名 */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  className={cn(
                    "input",
                    errors.username && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="4-20位，字母/数字/下划线"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="form-error">{errors.username.message}</p>
                )}
                <p className="text-xs text-secondary-500 mt-1">允许字符：a-z、A-Z、0-9、_</p>
              </div>
            </div>

            {/* 手机号与实名认证信息 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  手机号码
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    type="tel"
                    className={cn(
                      "input",
                      errors.phone && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="中国大陆11位手机号"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="form-error">{errors.phone.message}</p>
                  )}
                  <p className="text-xs text-secondary-500 mt-1">示例：13812345678</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="realName" className="form-label">
                  姓名（实名认证）
                </label>
                <div className="mt-1">
                  <input
                    id="realName"
                    type="text"
                    className={cn(
                      "input",
                      errors.realName && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="中文或英文（可含空格）"
                    {...register('realName')}
                  />
                  {errors.realName && (
                    <p className="form-error">{errors.realName.message}</p>
                  )}
                  <p className="text-xs text-secondary-500 mt-1">不允许数字或符号</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="idCard" className="form-label">
                身份证号码（实名认证）
              </label>
              <div className="mt-1">
                <input
                  id="idCard"
                  type="text"
                  className={cn(
                    "input",
                    errors.idCard && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="15-18位数字，末位可为X"
                  {...register('idCard')}
                />
                {errors.idCard && (
                  <p className="form-error">{errors.idCard.message}</p>
                )}
                <p className="text-xs text-secondary-500 mt-1">示例：440981200303145566 或 44098120030314556X</p>
              </div>
            </div>

            {/* 密码 */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                设置密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    "input pr-10",
                    errors.password && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="8-20位，含大小写字母、数字及特殊字符"
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
              {/* 密码强度指示器 */}
              {password && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300", getStrengthColor(passwordStrength))}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span className={cn("text-xs font-medium", 
                    passwordStrength <= 2 ? "text-red-500" : 
                    passwordStrength <= 4 ? "text-yellow-500" : "text-green-500"
                  )}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
              )}
              <p className="text-xs text-secondary-500 mt-1">必须同时包含：大小写字母、数字、特殊字符</p>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* 确认密码 */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                确认密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={cn(
                    "input pr-10",
                    errors.confirmPassword && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="请再次输入密码"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* 协议勾选 */}
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <Checkbox
                    id="agreeTerms"
                    checked={watch('agreeTerms')}
                    onCheckedChange={(checked) => setValue('agreeTerms', checked as boolean)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeTerms" className="text-secondary-500">
                    我已阅读并同意
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-500 mx-1">
                      《服务条款》
                    </a>
                  </label>
                  {errors.agreeTerms && (
                    <p className="form-error text-xs">{errors.agreeTerms.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <Checkbox
                    id="agreePrivacy"
                    checked={watch('agreePrivacy')}
                    onCheckedChange={(checked) => setValue('agreePrivacy', checked as boolean)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreePrivacy" className="text-secondary-500">
                    我已阅读并同意
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-500 mx-1">
                      《隐私政策》
                    </a>
                  </label>
                  {errors.agreePrivacy && (
                    <p className="form-error text-xs">{errors.agreePrivacy.message}</p>
                  )}
                </div>
              </div>
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
                  注册中...
                </>
              ) : (
                '立即注册'
              )}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-secondary-500">已有账号？</span>
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 ml-1"
            >
              直接登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
