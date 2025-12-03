import { Router } from 'express'
import { authMiddleware, adminGuard } from '../middleware/auth'
import { listConfigs, createConfig, updateConfig, deleteConfig, proxyInvoke, proxyStop, testInvoke, saveSession } from '../controllers/bishengController'

const router = Router()

router.use(authMiddleware)

router.get('/configs', adminGuard, listConfigs)
router.post('/configs', adminGuard, createConfig)
router.put('/configs/:id', adminGuard, updateConfig)
router.delete('/configs/:id', adminGuard, deleteConfig)

router.post('/invoke', proxyInvoke)
router.post('/stop', proxyStop)
router.post('/test', adminGuard, testInvoke)
router.post('/session', saveSession)

export default router
