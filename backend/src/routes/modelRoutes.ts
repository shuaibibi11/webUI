import { Router } from 'express'
import { prisma } from '../models/prisma'

const router = Router()

router.get('/active', async (req: any, res) => {
  try {
    const model = await prisma.modelConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' } })
    if (!model) return res.json({ model: null })
    const { id, provider, endpoint, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, updatedAt, createdAt } = model as any
    res.json({ model: { id, provider, endpoint, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, updatedAt, createdAt } })
  } catch (e) {
    res.status(500).json({ error: '获取当前模型失败' })
  }
})

export default router
