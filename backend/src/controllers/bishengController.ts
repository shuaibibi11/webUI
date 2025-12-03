import { Request, Response } from 'express'
import axios from 'axios'
import { prisma } from '../models/prisma'

const getHost = () => process.env.BISHENG_HOST || ''
const getTimeout = () => parseInt(process.env.BISHENG_TIMEOUT_MS || '30000')

export const listConfigs = async (req: Request, res: Response) => {
  try {
    const items = await prisma.bishengConfig.findMany({ orderBy: { updatedAt: 'desc' } })
    res.json({ items })
  } catch (e) {
    res.status(500).json({ error: '获取配置失败' })
  }
}

export const createConfig = async (req: Request, res: Response) => {
  try {
    const { name, workflowId, triggerType, triggerExpr, paramMap, enabled } = req.body
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: '名称不能为空' })
    }
    if (!workflowId || typeof workflowId !== 'string' || !workflowId.trim()) {
      return res.status(400).json({ error: 'workflowId不能为空' })
    }
    const item = await prisma.bishengConfig.create({ data: { name, workflowId, triggerType, triggerExpr, paramMap: typeof paramMap === 'string' ? paramMap : JSON.stringify(paramMap || {}), enabled: enabled ?? true } })
    if (item.enabled) {
      await prisma.modelConfig.updateMany({ data: { enabled: false } })
      await prisma.bishengConfig.updateMany({ where: { id: { not: item.id } }, data: { enabled: false } })
    }
    res.status(201).json({ item })
  } catch (e) {
    res.status(500).json({ error: '创建配置失败' })
  }
}

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, workflowId, triggerType, triggerExpr, paramMap, enabled } = req.body
    const exists = await prisma.bishengConfig.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ error: '配置不存在' })
    if (typeof name !== 'undefined' && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: '名称不能为空' })
    }
    if (typeof workflowId !== 'undefined' && (typeof workflowId !== 'string' || !workflowId.trim())) {
      return res.status(400).json({ error: 'workflowId不能为空' })
    }
    const item = await prisma.bishengConfig.update({ where: { id }, data: { name, workflowId, triggerType, triggerExpr, paramMap: typeof paramMap === 'string' ? paramMap : JSON.stringify(paramMap || {}), enabled } })
    if (item.enabled) {
      await prisma.modelConfig.updateMany({ data: { enabled: false } })
      await prisma.bishengConfig.updateMany({ where: { id: { not: item.id } }, data: { enabled: false } })
    }
    res.json({ item })
  } catch (e) {
    res.status(500).json({ error: '更新配置失败' })
  }
}

export const deleteConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.bishengConfig.delete({ where: { id } })
    res.json({ message: '删除成功' })
  } catch (e) {
    res.status(500).json({ error: '删除配置失败' })
  }
}

const retry = async <T>(fn: () => Promise<T>, times: number) => {
  let lastErr: any
  for (let i = 0; i < times; i++) {
    try { return await fn() } catch (e) { lastErr = e }
    await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, i), 5000)))
  }
  throw lastErr
}

export const proxyInvoke = async (req: Request, res: Response) => {
  try {
    const host = getHost()
    if (!host) return res.status(500).json({ error: '未配置BISHENG_HOST' })
    const url = host.replace(/\/$/, '') + '/v2/workflow/invoke'
    const { id, input, conversationId, session_id } = req.body || {}
    console.log('[bisheng invoke] 收到请求:', { conversationId, session_id, input: JSON.stringify(input).slice(0, 200) })

    // 校验 input - 允许字符串（JSON）或对象；仅当完全为空时才报错
    if (typeof input === 'undefined' || input === null) {
      return res.status(400).json({ error: '缺少 input 参数或格式不正确' })
    }

    let payload = req.body || {}
    let cfg = null as any
    if (id) {
      cfg = await prisma.bishengConfig.findUnique({ where: { id } })
      if (!cfg) return res.status(404).json({ error: '配置不存在' })
    } else {
      cfg = await prisma.bishengConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' } })
    }
    let map: any = {}
    try { map = cfg.paramMap ? JSON.parse(cfg.paramMap as any) : {} } catch {}
    let sessionId = session_id
    if (!sessionId && conversationId) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { bishengSessionId: true } })
      sessionId = conv?.bishengSessionId || undefined
      console.log('[bisheng invoke] 从数据库获取 session_id:', sessionId)
    }
    console.log('[bisheng invoke] 最终使用 session_id:', sessionId)
    let normalizedInput: any = input
    if (typeof normalizedInput === 'string') {
      try { normalizedInput = JSON.parse(normalizedInput) } catch {}
    }
    const mergedInput: any = { ...map, ...(normalizedInput || {}) }
    console.log('[bisheng invoke] mergedInput keys:', Object.keys(mergedInput))
    try { console.log('[bisheng invoke] mergedInput preview:', JSON.stringify(mergedInput).slice(0, 300)) } catch {}
    if (typeof mergedInput.text === 'string' && typeof mergedInput.input === 'undefined') {
      mergedInput.input = mergedInput.text
    }
    if (typeof mergedInput.prompt === 'string' && typeof mergedInput.input === 'undefined') {
      mergedInput.input = mergedInput.prompt
    }
    if (typeof mergedInput.input === 'string' && typeof mergedInput.user_input === 'undefined') {
      mergedInput.user_input = mergedInput.input
    }

    // 如果是嵌套结构（例如 input_762d1: { user_input: "..." }），需要保留原始结构
    // mergedInput 目前是将 input 对象展开了 { ...map, ...input }
    // 如果 req.body.input 是 { input_762d1: { user_input: "..." } }
    // 那么 mergedInput 也是 { input_762d1: { user_input: "..." } }
    
    // 检查 mergedInput 是否包含任何键
    const mergedKeys = Object.keys(mergedInput)
    if (mergedKeys.length === 0) {
         return res.status(400).json({ error: 'input 内容不能为空' })
    }

    // 如果是标准节点输入结构（形如 input_xxx: { ... }），只要内层存在非空对象即可通过
    // 示例：{ input_762d1: { user_input: '你好' } }
    const isNodeStructured = mergedKeys.every(k => /^input_/.test(k))
    if (isNodeStructured) {
        const hasNonEmptyValue = mergedKeys.some(k => {
            const v = (mergedInput as any)[k]
            if (v && typeof v === 'object') {
                return Object.keys(v).length > 0
            }
            return typeof v === 'string' ? v.trim().length > 0 : !!v
        })
        if (!hasNonEmptyValue) {
            return res.status(400).json({ error: 'input 内容不能为空' })
        }
        const nodeKeys = mergedKeys.filter(k => /^input_/.test(k))
        if (nodeKeys.length === 1) {
            const nodeKey = nodeKeys[0]
            const nodeInput = (mergedInput as any)[nodeKey]
            if (nodeInput && typeof nodeInput === 'object') {
                (req.body as any).node_id = nodeKey.replace(/^input_/, '')
                for (const k of Object.keys(mergedInput)) delete (mergedInput as any)[k]
                Object.assign(mergedInput, nodeInput)
            }
        }
    }

    // 如果 mergedInput 中没有 user_input/prompt/text/input 字段，
    // 但有其他字段（比如 input_762d1），我们认为这是有效的 Bisheng 节点输入格式
    // 这种情况下，不需要强制要求有 user_input 等字段
    // 我们只在 mergedInput 完全为空时报错

    const workflowId = cfg?.workflowId || (typeof req.body?.workflow_id === 'string' ? req.body.workflow_id : undefined)
    if (!workflowId) {
      return res.status(400).json({ error: '未启用bisheng配置，且未提供workflow_id' })
    }
    payload = {
      workflow_id: workflowId,
      stream: req.body?.stream !== false,
      input: mergedInput,
      session_id: sessionId,
      message_id: typeof (req.body?.message_id) === 'string' ? req.body.message_id : undefined,
      node_id: typeof (req.body?.node_id) === 'string' ? req.body.node_id : undefined,
    }
    console.log('[bisheng invoke] 发送到 bisheng 的 payload:', JSON.stringify(payload, null, 2))
    const stream = !(payload && payload.stream === false)
    const instance = axios.create({ timeout: getTimeout(), responseType: stream ? 'stream' : 'json' })
    const headers: any = { 'Content-Type': 'application/json', 'Accept': stream ? 'text/event-stream' : 'application/json' }
    const apiKey = process.env.BISHENG_API_KEY || ''
    const authToken = process.env.BISHENG_AUTH_TOKEN || ''
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    if (authToken) headers['X-Auth-Token'] = authToken
    const doReq = async () => instance.post(url, payload, { headers, validateStatus: () => true })
    const r = await retry(() => doReq(), 3)
    // 记录审计日志
    const userId = (req as any).user?.userId
    try {
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'bisheng_invoke',
            ip: (req.headers['x-forwarded-for'] as string) || req.ip,
            details: JSON.stringify({ workflowId: cfg.workflowId, conversationId, sessionId })
          }
        })
      }
    } catch {}

    if (stream) {
      if (r.status >= 400) {
        res.status(r.status).end(typeof r.data === 'string' ? r.data : JSON.stringify(r.data))
        return
      }
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Transfer-Encoding', 'chunked')
      if (typeof (res as any).flushHeaders === 'function') { (res as any).flushHeaders() }
      
      // 心跳机制
      const heartbeatInterval = setInterval(() => {
          res.write(': heartbeat\n\n')
      }, 15000)

      res.on('close', () => {
          clearInterval(heartbeatInterval)
      })

      const upstream: any = r.data
      let lastEventData = null as any

      upstream.on('data', (chunk: any) => {
        // 解析 SSE 数据，尝试提取 session_id
        const str = chunk.toString()
        // 简单的正则匹配，实际可能需要更复杂的解析
        // 假设 bisheng 返回的 SSE 格式中包含 session_id
        // 这里只是示例，具体需要根据 bisheng 返回格式调整
        // 比如: event: message\ndata: {"session_id": "xxx", ...}
        try {
            const lines = str.split('\n')
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6)
                    if (dataStr.trim() === '[DONE]') continue
                    const data = JSON.parse(dataStr)
                    if (data.session_id) {
                        // 可以在这里更新 session_id，或者等结束后统一更新
                        // 考虑到流式传输，这里先不做数据库操作，除非确认是最后一次
                        // 或者在流结束时更新
                        lastEventData = data
                    }
                }
            }
        } catch (e) {}
      })

      upstream.pipe(res)
      
      upstream.on('end', async () => {
          if (lastEventData && lastEventData.session_id && conversationId) {
             try {
                 await prisma.conversation.update({ 
                     where: { id: conversationId }, 
                     data: { bishengSessionId: lastEventData.session_id } 
                 })
                 console.log('[bisheng invoke] 更新会话 session_id:', lastEventData.session_id)
             } catch (e) {
                 console.error('[bisheng invoke] 更新会话 session_id 失败:', e)
             }
          }
      })

      // 添加取消机制
    req.on('close', () => {
        // 如果是流式请求，客户端断开连接时，尝试取消后端请求
        if (stream) {
            try { upstream.destroy() } catch {}
        }
    })
    
    // 设置超时
    const timeoutMs = getTimeout()
    res.setTimeout(timeoutMs, () => {
        res.status(504).json({ error: '请求超时' })
    })
    } else {
      // 非流式响应，直接更新 session_id
      if (r.data && r.data.session_id && conversationId) {
          try {
             await prisma.conversation.update({ 
                 where: { id: conversationId }, 
                 data: { bishengSessionId: r.data.session_id } 
             })
             console.log('[bisheng invoke] 更新会话 session_id:', r.data.session_id)
          } catch (e) {
              console.error('[bisheng invoke] 更新会话 session_id 失败:', e)
          }
      }
      res.status(r.status).json(r.data)
    }
  } catch (e: any) {
    res.status(502).json({ error: '工作流调用失败' })
  }
}

export const proxyStop = async (req: Request, res: Response) => {
  try {
    const host = getHost()
    if (!host) return res.status(500).json({ error: '未配置BISHENG_HOST' })
    const url = host.replace(/\/$/, '') + '/v2/workflow/stop'
    const instance = axios.create({ timeout: getTimeout() })
    const headers: any = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    const apiKey = process.env.BISHENG_API_KEY || ''
    const authToken = process.env.BISHENG_AUTH_TOKEN || ''
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    if (authToken) headers['X-Auth-Token'] = authToken
    const doReq = async () => instance.post(url, req.body, { headers })
    const r = await retry(() => doReq(), 3)
    res.json(r.data)
  } catch (e: any) {
    res.status(502).json({ error: '工作流停止失败' })
  }
}

export const testInvoke = async (req: Request, res: Response) => {
  try {
    const { id, input } = req.body as any
    const cfg = id ? await prisma.bishengConfig.findUnique({ where: { id } }) : null
    if (id && !cfg) return res.status(404).json({ error: '配置不存在' })
    const payload = cfg ? { workflow_id: cfg.workflowId, stream: false, input } : req.body
    const host = getHost()
    if (!host) return res.status(500).json({ error: '未配置BISHENG_HOST' })
    const url = host.replace(/\/$/, '') + '/v2/workflow/invoke'
    const instance = axios.create({ timeout: getTimeout() })
    const headers: any = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    const apiKey = process.env.BISHENG_API_KEY || ''
    const authToken = process.env.BISHENG_AUTH_TOKEN || ''
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    if (authToken) headers['X-Auth-Token'] = authToken
    const doReq = async () => instance.post(url, payload, { headers })
    const r = await retry(() => doReq(), 2)
    res.json({ ok: true, data: r.data })
  } catch (e: any) {
    res.status(502).json({ error: '测试调用失败' })
  }
}

export const saveSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const { conversationId, sessionId } = req.body as any
    if (!conversationId || !sessionId) return res.status(400).json({ error: '缺少必要参数' })
    const own = await prisma.conversation.findFirst({ where: { id: conversationId, userId } })
    if (!own) return res.status(404).json({ error: '对话不存在或无权限' })
    await prisma.conversation.update({ where: { id: conversationId }, data: { bishengSessionId: sessionId } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: '保存会话失败' })
  }
}
