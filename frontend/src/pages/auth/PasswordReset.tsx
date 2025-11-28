import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

const schema = z.object({ identifier: z.string().min(3), newPassword: z.string().min(8) });
type FormData = z.infer<typeof schema>;

export default function PasswordReset() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const onSubmit = async (data: FormData) => {
    try {
      const req = await api.post<{ token: string }>(`/users/password-reset/request`, { identifier: data.identifier });
      const token = req.token;
      await api.post(`/users/password-reset/confirm`, { token, newPassword: data.newPassword });
      toast({ title: '密码已重置', description: '请使用新密码登录' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: '重置失败', description: e?.message || '请稍后重试' });
    }
  };
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-secondary-200 rounded-lg p-6 space-y-3">
        <div className="flex items-start space-x-2 bg-white border border-secondary-200 rounded-md p-3">
          <AlertCircle className="w-4 h-4 text-secondary-600 mt-0.5" />
          <div className="text-sm text-secondary-800">
            若出现“接口不存在”等提示，请刷新或重启服务后再试。
          </div>
        </div>
        <h1 className="text-lg font-semibold text-secondary-900 mb-4">重置密码</h1>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input className="input" placeholder="用户名/邮箱/手机号" {...register('identifier')} />
          {errors.identifier && <p className="form-error">{errors.identifier.message}</p>}
          <input className="input" type="password" placeholder="新密码（至少8位）" {...register('newPassword')} />
          {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
          <button className="btn btn-primary w-full" type="submit">提交重置</button>
        </form>
      </div>
    </div>
  );
}
