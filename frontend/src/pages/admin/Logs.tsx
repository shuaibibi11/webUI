import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface LogItem {
  id: string;
  userId: string;
  action: string;
  ip?: string;
  details?: string;
  createdAt: string;
}

export default function LogsAdmin() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const res = await api.get<{ logs: LogItem[] }>(`/admin/logs${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      setLogs(res.logs);
    } catch (e) {
      const msg = (e as { message?: string })?.message || '无法获取日志';
      toast({ variant: 'destructive', title: '加载失败', description: msg });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [query]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ items: logs }, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_logs.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportTxt = () => {
    const lines = logs.map(l => `${new Date(l.createdAt).toLocaleString()} ${l.userId} ${l.action} ${l.ip || '-'} ${l.details || '-'}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_logs.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportMd = () => {
    const md = logs.map(l => `- 时间: ${new Date(l.createdAt).toLocaleString()}\n  - 用户: ${l.userId}\n  - 动作: ${l.action}\n  - IP: ${l.ip || '-'}\n  - 详情: ${l.details || '-'}`).join('\n\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_logs.md`; a.click();
    URL.revokeObjectURL(url);
  };

  // const exportJson = () => {
  //   const blob = new Blob([JSON.stringify({ items: logs }, null, 2)], { type: 'application/json;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url; a.download = `audit_logs.json`; a.click();
  //   URL.revokeObjectURL(url);
  // };

  // const exportTxt = () => {
  //   const lines = logs.map(l => `${new Date(l.createdAt).toLocaleString()} ${l.userId} ${l.action} ${l.ip || '-'} ${l.details || '-'}`);
  //   const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url; a.download = `audit_logs.txt`; a.click();
  //   URL.revokeObjectURL(url);
  // };

  // const exportMd = () => {
  //   const md = logs.map(l => `- 时间: ${new Date(l.createdAt).toLocaleString()}\n  - 用户: ${l.userId}\n  - 动作: ${l.action}\n  - IP: ${l.ip || '-'}\n  - 详情: ${l.details || '-'}`).join('\n\n');
  //   const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url; a.download = `audit_logs.md`; a.click();
  //   URL.revokeObjectURL(url);
  // };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-secondary-900">审计日志</h1>
      <div className="flex items-center space-x-2">
        <input className="input" placeholder="按动作或IP搜索" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="btn btn-primary" onClick={load}>刷新</button>
      </div>

      <div className="bg-white border border-secondary-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-secondary-600">
              <th className="p-3">时间</th>
              <th className="p-3">用户</th>
              <th className="p-3">动作</th>
              <th className="p-3">IP</th>
              <th className="p-3">详情</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t border-secondary-100">
                <td className="p-3">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3">{l.userId}</td>
                <td className="p-3">{l.action}</td>
                <td className="p-3">{l.ip || '-'}</td>
                <td className="p-3">{l.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center space-x-2">
        <button className="btn btn-outline" onClick={exportJson}>导出JSON</button>
        <button className="btn btn-outline" onClick={exportMd}>导出MD</button>
        <button className="btn btn-outline" onClick={exportTxt}>导出TXT</button>
      </div>
      <div className="flex items-center space-x-2">
        <button className="btn btn-outline" onClick={exportJson}>导出JSON</button>
        <button className="btn btn-outline" onClick={exportMd}>导出MD</button>
        <button className="btn btn-outline" onClick={exportTxt}>导出TXT</button>
      </div>
    </div>
  );
}
