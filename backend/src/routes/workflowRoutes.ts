import { Router } from 'express'
import { proxyInvoke, proxyStop } from '../controllers/bishengController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.post('/invoke', proxyInvoke)
router.post('/stop', proxyStop)

export default router
