import api from './api'

type BishengConfigItem = { id: string; name: string; workflowId: string; enabled: boolean; updatedAt: string; createdAt: string };
type InvokePayload = { id?: string; input?: Record<string, unknown>; conversationId?: string; stream?: boolean; session_id?: string };
type StopPayload = { session_id?: string };

export const bishengService = {
  listConfigs: () => api.get<{ items: BishengConfigItem[] }>('/bisheng/configs'),
  createConfig: (data: { name: string; workflowId: string; triggerType?: string; triggerExpr?: string; paramMap?: Record<string, unknown>; enabled?: boolean }) => api.post('/bisheng/configs', data),
  updateConfig: (id: string, data: Partial<{ name: string; workflowId: string; triggerType: string; triggerExpr: string; paramMap: Record<string, unknown>; enabled: boolean }>) => api.put(`/bisheng/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete<{ message: string }>(`/bisheng/configs/${id}`),
  invoke: (payload: InvokePayload) => api.post('/bisheng/invoke', payload),
  stop: (payload: StopPayload) => api.post('/bisheng/stop', payload),
  test: (id: string, input?: Record<string, unknown>) => api.post<{ ok: boolean; data: unknown }>('/bisheng/test', { id, input }),
}

export default bishengService
