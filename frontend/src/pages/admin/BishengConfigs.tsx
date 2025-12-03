import { useEffect, useState } from 'react'
import api from '@/services/api'
import { useToast } from '@/hooks/use-toast'

interface BishengConfig {
  id: string
  name: string
  workflowId: string
  triggerType: string
  triggerExpr: string
  paramMap: Record<string, unknown>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export default function BishengConfigs() {
  const { toast } = useToast()
  const [items, setItems] = useState<BishengConfig[]>([])
  const [editing, setEditing] = useState<BishengConfig | null>(null)
  const [form, setForm] = useState<Partial<BishengConfig>>({ enabled: true, triggerType: 'manual', triggerExpr: '' })

  const load = async () => {
    try {
      const r = await api.get<{ items: BishengConfig[] }>("/bisheng/configs")
      setItems(r.items)
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试'
      toast({ variant: 'destructive', title: '加载失败', description: msg })
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const save = async () => {
    try {
      if (!form.name || !String(form.name).trim()) {
        toast({ variant: 'destructive', title: '校验失败', description: '名称不能为空' })
        return
      }
      if (!form.workflowId || !String(form.workflowId).trim()) {
        toast({ variant: 'destructive', title: '校验失败', description: 'workflowId不能为空' })
        return
      }
      if (editing) {
        await api.put(`/bisheng/configs/${editing.id}`, form)
      } else {
        await api.post('/bisheng/configs', form)
      }
      toast({ title: '保存成功' })
      setEditing(null)
      setForm({ enabled: true, triggerType: 'manual', triggerExpr: '' })
      load()
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试'
      toast({ variant: 'destructive', title: '保存失败', description: msg })
    }
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/bisheng/configs/${id}`)
      toast({ title: '已删除' })
      load()
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试'
      toast({ variant: 'destructive', title: '删除失败', description: msg })
    }
  }

  const testInvoke = async (cfg: BishengConfig) => {
    try {
      const r = await api.post<{ ok: boolean; data: unknown }>(`/bisheng/test`, { id: cfg.id, input: { ping: 'pong' } })
      toast({ title: '测试成功', description: '调用正常' })
      console.log('bisheng test result', r)
    } catch (e) {
      const msg = (e as { message?: string })?.message || '请稍后重试'
      toast({ variant: 'destructive', title: '测试失败', description: msg })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-secondary-900">bisheng配置</h1>
      <div className="space-y-3">
        {items.map(m => (
          <div key={m.id} className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-secondary-900">{m.name}</div>
              <div className="text-xs text-secondary-500">workflowId: {m.workflowId}</div>
              <div className="text-xs text-secondary-500">触发: {m.triggerType} · {m.triggerExpr}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn btn-outline" onClick={() => { setEditing(m); setForm(m) }}>编辑</button>
              <button className="btn btn-secondary" onClick={() => remove(m.id)}>删除</button>
              <button className="btn btn-primary" onClick={() => testInvoke(m)}>测试调用</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white border border-secondary-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="工作流名称" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="workflowId" value={form.workflowId || ''} onChange={e => setForm({ ...form, workflowId: e.target.value })} />
          <input className="input" placeholder="触发类型" value={form.triggerType || ''} onChange={e => setForm({ ...form, triggerType: e.target.value })} />
          <input className="input" placeholder="触发表达式" value={form.triggerExpr || ''} onChange={e => setForm({ ...form, triggerExpr: e.target.value })} />
          <textarea className="input" placeholder="参数映射(JSON)" value={JSON.stringify(form.paramMap || {}, null, 2)} onChange={e => {
            try { setForm({ ...form, paramMap: JSON.parse(e.target.value || '{}') }) } catch { void 0; }
          }} />
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={form.enabled ?? true} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            <span>启用</span>
          </label>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <button className="btn btn-primary" onClick={save}>保存</button>
          {editing && <button className="btn btn-outline" onClick={() => { setEditing(null); setForm({ enabled: true, triggerType: 'manual', triggerExpr: '' }) }}>取消</button>}
        </div>
      </div>
    </div>
  )
}
