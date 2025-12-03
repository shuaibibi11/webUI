import { Router } from 'express'
import { prisma } from '../models/prisma'

const router = Router()

router.get('/active', async (req: any, res) => {
  try {
    const bishengEnabled = await prisma.bishengConfig.findFirst({ where: { enabled: true } })
    if (bishengEnabled) {
      return res.json({ model: { id: bishengEnabled.id, provider: 'bisheng', endpoint: process.env.BISHENG_HOST || '', modelName: bishengEnabled.name, tag: 'workflow', protocol: 'custom', temperature: 0, maxTokens: 0, topP: 1, contextLength: 0, memoryEnabled: true, updatedAt: bishengEnabled.updatedAt, createdAt: bishengEnabled.createdAt } })
    }
    const model = await prisma.modelConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' } })
    if (!model) return res.json({ model: null })
    const { id, provider, endpoint, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, updatedAt, createdAt } = model as any
    res.json({ model: { id, provider, endpoint, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, updatedAt, createdAt } })
  } catch (e) {
    res.status(500).json({ error: '获取当前模型失败' })
  }
})

export default router
