import { useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      toast({ variant: 'destructive', title: '请输入账号密码' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<any>('/users/login', { username, password });
      const token = res?.token as string;
      const role = res?.user?.role as string;
      if (!token || role !== 'ADMIN') {
        toast({ variant: 'destructive', title: '权限不足', description: '需要管理员账号登录' });
        setLoading(false);
        return;
      }
      // 将令牌仅写入localStorage，避免与11004互相影响
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_info', JSON.stringify(res.user));
      window.location.href = '/admin';
    } catch (e: any) {
      toast({ variant: 'destructive', title: '登录失败', description: e?.message || '请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="w-full max-w-sm bg-white border border-secondary-200 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-secondary-900 mb-4">管理后台登录</h1>
        <input className="input mb-3" placeholder="用户名或邮箱" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="input mb-3" type="password" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full" onClick={submit} disabled={loading}>{loading? '登录中...' : '登录'}</button>
      </div>
    </div>
  );
}
