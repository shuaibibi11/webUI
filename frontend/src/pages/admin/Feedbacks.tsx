import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface FeedbackItem {
  id: string;
  userId: string;
  type: string;
  content: string;
  contact?: string;
  status: string;
  handledAt?: string;
  resolution?: string;
  createdAt: string;
  user?: { id: string; username: string; email: string; phone: string; realName: string };
}

export default function FeedbacksAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<{ feedbacks: FeedbackItem[] }>(`/admin/feedbacks`);
      setItems(res.feedbacks);
    } catch (e) {
      const msg = (e as { message?: string })?.message || '无法获取反馈列表';
      toast({ variant: 'destructive', title: '加载失败', description: msg });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const startEdit = (item: FeedbackItem) => {
    setEditingId(item.id);
    setStatus(item.status);
    setResolution(item.resolution || '');
  };

  const save = async () => {
    if (!editingId) return;
    try {
      await api.put(`/admin/feedbacks/${editingId}`, { status, resolution });
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, status, resolution, handledAt: new Date().toISOString() } : i));
      setEditingId(null);
      toast({ title: '已更新' });
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试';
      toast({ variant: 'destructive', title: '更新失败', description: msg });
    }
  };

  const filtered = items.filter(i => {
    const matchText = filter ? (i.content.includes(filter) || i.user?.username.includes(filter)) : true;
    return matchText;
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-secondary-900">反馈管理</h1>
      <div className="flex items-center space-x-2">
        <input className="input" placeholder="按内容或用户名过滤" value={filter} onChange={e=>setFilter(e.target.value)} />
        <button className="btn btn-primary" onClick={load}>刷新</button>
      </div>
      <div className="bg-white border border-secondary-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-secondary-600">
              <th className="p-3">时间</th>
              <th className="p-3">用户</th>
              <th className="p-3">类型</th>
              <th className="p-3">内容</th>
              <th className="p-3">联系方式</th>
              <th className="p-3">状态</th>
              <th className="p-3">处理</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className="border-t border-secondary-100 align-top">
                <td className="p-3 text-xs text-secondary-500">{new Date(i.createdAt).toLocaleString()}</td>
                <td className="p-3 text-xs">{i.user?.username}</td>
                <td className="p-3 text-xs">{i.type}</td>
                <td className="p-3 text-xs whitespace-pre-wrap">{i.content}</td>
                <td className="p-3 text-xs">{i.contact || '-'}</td>
                <td className="p-3 text-xs">{i.status}</td>
                <td className="p-3">
                  {editingId === i.id ? (
                    <div className="space-y-2">
                      <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
                        <option value="pending">待处理</option>
                        <option value="processing">处理中</option>
                        <option value="resolved">已解决</option>
                      </select>
                      <textarea className="input" placeholder="处理说明" value={resolution} onChange={e=>setResolution(e.target.value)} />
                      <div className="space-x-2">
                        <button className="btn btn-primary" onClick={save}>保存</button>
                        <button className="btn btn-secondary" onClick={()=>setEditingId(null)}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-outline" onClick={()=>startEdit(i)}>处理</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
