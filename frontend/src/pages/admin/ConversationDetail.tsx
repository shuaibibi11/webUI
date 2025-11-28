import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';

interface Msg {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function ConversationDetail() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [q, setQ] = useState('');

  const load = async () => {
    if (!id) return;
    const res = await api.get<{ messages: Msg[]; pagination: { total: number } }>(`/admin/conversations/${id}/messages?page=${page}&limit=${limit}`);
    setMessages(res.messages);
  };

  const search = async () => {
    if (!id) return;
    const res = await api.get<{ messages: Msg[] }>(`/admin/conversations/${id}/search?q=${encodeURIComponent(q)}`);
    setMessages(res.messages);
  };

  useEffect(() => { load(); }, [id, page, limit]);

  const exportCsv = () => {
    const rows = messages.map(m => `${m.id},${m.role},${JSON.stringify(m.content).replace(/,/g,';')},${m.createdAt}`);
    const blob = new Blob([`id,role,content,createdAt\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `conversation_${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <input className="input" placeholder="搜索消息" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={search}>搜索</button>
        <button className="btn btn-outline" onClick={exportCsv}>导出CSV</button>
      </div>
      <div className="bg-white border border-secondary-200 rounded-lg p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className="border-b border-secondary-100 pb-2">
            <div className="text-xs text-secondary-500">{new Date(m.createdAt).toLocaleString()} · {m.role}</div>
            <div className="text-sm text-secondary-900 whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <button className="btn btn-outline" disabled={page<=1} onClick={() => setPage(p=>p-1)}>上一页</button>
        <button className="btn btn-outline" onClick={() => setPage(p=>p+1)}>下一页</button>
        <select className="input" value={limit} onChange={e=>setLimit(parseInt(e.target.value))}>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}
