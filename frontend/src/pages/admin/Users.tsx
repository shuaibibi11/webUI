import { useEffect, useEffectEvent, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  realName: string;
  idCard?: string;
  isVerified: boolean;
  banned: boolean;
  role: string;
}

export default function UsersAdmin() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  const onUsersLoaded = useEffectEvent((list: User[]) => {
    setUsers(list);
  });
  const onLoadError = useEffectEvent((msg: string) => {
    toast({ variant: 'destructive', title: '加载失败', description: msg });
  });

  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      try {
        const res = await api.get<{ users: User[] }>(
          '/admin/users'
        );
        if (!cancelled) onUsersLoaded(res.users);
      } catch (e) {
        if (!cancelled) {
          const msg = (e as { message?: string })?.message || '无法获取用户列表';
          onLoadError(msg);
        }
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    if (!editing) return;
    try {
      await api.put(`/admin/users/${editing.id}`, {
        email: form.email,
        phone: form.phone,
        realName: form.realName,
        isVerified: Boolean(form.isVerified ?? editing.isVerified)
      });
      toast({ title: '保存成功' });
      // 立即更新当前列表行，避免必须刷新
      setUsers(prev => prev.map(u => u.id === editing.id ? {
        ...u,
        email: form.email ?? u.email,
        phone: form.phone ?? u.phone,
        realName: form.realName ?? u.realName,
        isVerified: Boolean(form.isVerified ?? u.isVerified)
      } : u));
      setEditing(null);
      setForm({});
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试';
      toast({ variant: 'destructive', title: '保存失败', description: msg });
    }
  };

  const toggleBan = async (u: User) => {
    try {
      await api.put(`/admin/users/${u.id}/ban`, { banned: !u.banned });
      toast({ title: !u.banned ? '已封禁' : '已解封', description: !u.banned ? '用户将无法登录' : '用户可正常登录' });
      const res = await api.get<{ users: User[] }>(`/admin/users`);
      setUsers(res.users);
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试';
      toast({ variant: 'destructive', title: '操作失败', description: msg });
    }
  };

  const approveUser = async (u: User) => {
    try {
      await api.put(`/admin/users/${u.id}`, { isVerified: true });
      toast({ title: '审批通过', description: '用户已具备登录权限' });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isVerified: true } : x));
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试';
      toast({ variant: 'destructive', title: '审批失败', description: msg });
    }
  };

  const resetPassword = async (u: User) => {
    const np = prompt(`为用户 ${u.username} 设置新密码（至少8位）：`);
    if (!np || np.length < 8) { toast({ variant: 'destructive', title: '密码不符合要求' }); return; }
    try {
      await api.put(`/admin/users/${u.id}/password`, { newPassword: np });
      toast({ title: '已重置密码', description: '用户可使用新密码登录' });
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试';
      toast({ variant: 'destructive', title: '重置失败', description: msg });
    }
  };

  const inspectConversations = async (u: User) => {
    try {
      const res = await api.get<{ conversations: { id: string }[] }>(`/admin/users/${u.id}/conversations`);
      if (res.conversations.length === 0) {
        toast({ title: '用户会话', description: '暂无会话' });
        return;
      }
      // 打开第一个会话详情页；后续可以弹窗选择
      const convId = res.conversations[0].id;
      // 使用可导航路由避免直接修改全局对象
      window.location.assign(`/admin/conversations/${convId}`);
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试';
      toast({ variant: 'destructive', title: '获取会话失败', description: msg });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white border border-secondary-200 rounded-md p-3 flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 text-secondary-600 mt-0.5" />
        <div className="text-sm text-secondary-800">
          操作提示：封禁/解封、审批通过、重置密码为即时生效；若操作后仍无效，请刷新页面或重启服务后重试。
        </div>
      </div>
      <h1 className="text-xl font-semibold text-secondary-900">账号管理</h1>
      <div className="bg-white border border-secondary-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-secondary-600">
              <th className="p-3">用户名</th>
              <th className="p-3">邮箱</th>
              <th className="p-3">手机</th>
              <th className="p-3">实名</th>
              <th className="p-3">角色</th>
              <th className="p-3">状态</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-secondary-100">
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.realName}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.banned ? '封禁' : (u.isVerified ? '已审批' : '待审批')}</td>
                <td className="p-3 space-x-2">
                  <button className="btn btn-outline" onClick={() => { setEditing(u); setForm(u); }}>编辑</button>
                  <button className="btn btn-outline" onClick={() => inspectConversations(u)}>查看会话</button>
                  {!u.isVerified && !u.banned && (
                    <button className="btn btn-primary" onClick={() => approveUser(u)}>审批通过</button>
                  )}
                  <button className="btn btn-outline" onClick={() => resetPassword(u)}>重置密码</button>
                  <button className="btn btn-secondary" onClick={() => toggleBan(u)}>{u.banned ? '解封' : '封禁'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <h2 className="text-sm font-medium">编辑用户：{editing.username}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <input className="input" placeholder="邮箱" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="手机" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input className="input" placeholder="实名" value={form.realName || ''} onChange={e => setForm({ ...form, realName: e.target.value })} />
            <div className="flex items-center space-x-2">
              <input id="verified" type="checkbox" checked={Boolean(form.isVerified ?? editing.isVerified)} onChange={e => setForm({ ...form, isVerified: e.target.checked })} />
              <label htmlFor="verified" className="text-sm">通过审批</label>
            </div>
          </div>
          <div className="mt-3 space-x-2">
            <button className="btn btn-primary" onClick={save}>保存</button>
            <button className="btn btn-secondary" onClick={() => { setEditing(null); setForm({}); }}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
