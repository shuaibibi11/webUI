import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ModelConfig {
  id: string;
  provider: string;
  endpoint: string;
  apiKey?: string;
  modelName: string;
  tag: string;
  protocol: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ModelsAdmin() {
  const { toast } = useToast();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [editing, setEditing] = useState<ModelConfig | null>(null);
  const [form, setForm] = useState<Partial<ModelConfig>>({ protocol: 'openai', temperature: 0.7, maxTokens: 8192, topP: 0.9, enabled: true, tag: '语言模型' });

  const load = async () => {
    try {
      const res = await api.get<{ models: ModelConfig[] }>('/admin/models');
      setModels(res.models);
    } catch (e: any) {
      toast({ variant: 'destructive', title: '加载失败', description: e.message || '无法获取模型配置' });
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (editing) {
      await api.put<{ model: ModelConfig }>(`/admin/models/${editing.id}`, form);
        toast({ title: '已保存', description: '模型配置已更新' });
      } else {
        await api.post<{ model: ModelConfig }>('/admin/models', form);
        toast({ title: '已保存', description: '模型配置已创建' });
      }
      setEditing(null);
      setForm({ temperature: 0.7, maxTokens: 8192, topP: 0.9, enabled: true, tag: '语言模型' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: '保存失败', description: e.message || '请检查输入' });
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/admin/models/${id}`);
      toast({ title: '删除成功', description: '模型已删除' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: '删除失败', description: e.message || '请稍后重试' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-secondary-900">模型配置</h1>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>添加模型</button>
      </div>

      <div className="space-y-3">
        {models.map(m => (
          <div key={m.id} className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-secondary-900">{m.modelName}</div>
              <div className="text-xs text-secondary-500">{m.provider} · {m.endpoint}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn btn-outline" onClick={() => { setEditing(m); setForm(m); }}>编辑</button>
              <button className="btn btn-secondary" onClick={() => remove(m.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white border border-secondary-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="提供商" value={form.provider || ''} onChange={e => setForm({ ...form, provider: e.target.value })} />
          <input className="input" placeholder="接口地址" value={form.endpoint || ''} onChange={e => setForm({ ...form, endpoint: e.target.value })} />
          <input className="input" placeholder="API密钥" value={form.apiKey || ''} onChange={e => setForm({ ...form, apiKey: e.target.value })} />
          <input className="input" placeholder="模型名称" value={form.modelName || ''} onChange={e => setForm({ ...form, modelName: e.target.value })} />
          <input className="input" placeholder="模型标签" value={form.tag || ''} onChange={e => setForm({ ...form, tag: e.target.value })} />
          <select className="input" value={form.protocol || 'openai'} onChange={e => setForm({ ...form, protocol: e.target.value })}>
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
            <option value="siliconflow">SiliconFlow</option>
            <option value="custom">自定义</option>
          </select>
          <div>
            <label className="form-label">模型温度：{form.temperature}</label>
            <input type="range" min={0} max={1} step={0.1} value={form.temperature || 0} onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="form-label">最大生成Token数：{form.maxTokens}</label>
            <input type="range" min={256} max={8192} step={256} value={form.maxTokens || 256} onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="form-label">Top P：{form.topP}</label>
            <input type="range" min={0} max={1} step={0.1} value={form.topP || 0} onChange={e => setForm({ ...form, topP: parseFloat(e.target.value) })} />
          </div>
          <div className="flex items-center space-x-2">
            <input id="enabled" type="checkbox" checked={Boolean(form.enabled)} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            <label htmlFor="enabled" className="text-sm text-secondary-700">启用</label>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <button className="btn btn-primary" onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
}
