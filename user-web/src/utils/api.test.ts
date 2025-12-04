import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { requestInterceptor, responseInterceptor, handleError, request, get, post, put, del, bisheng } from './api'

describe('api.ts', () => {
  // 模拟localStorage
  beforeEach(() => {
    localStorage.clear()
    // 模拟fetch API
    global.fetch = vi.fn()
    // 模拟message.error
    vi.mock('naive-ui', () => ({
      message: {
        error: vi.fn()
      }
    }))
  })

  describe('requestInterceptor', () => {
    it('adds token to headers when token exists', () => {
      // 设置token
      localStorage.setItem('token', 'test-token')
      
      const config = {
        url: '/test',
        method: 'GET' as const
      }
      
      const result = requestInterceptor(config)
      
      expect(result.headers).toHaveProperty('Authorization', 'Bearer test-token')
    })

    it('does not add token to headers when token does not exist', () => {
      // 不设置token
      
      const config = {
        url: '/test',
        method: 'GET' as const
      }
      
      const result = requestInterceptor(config)
      
      expect(result.headers).toBeUndefined()
    })

    it('adds Content-Type to headers when data exists', () => {
      const config = {
        url: '/test',
        method: 'POST' as const,
        data: { test: 'data' }
      }
      
      const result = requestInterceptor(config)
      
      expect(result.headers).toHaveProperty('Content-Type', 'application/json')
    })

    it('does not override existing Content-Type', () => {
      const config = {
        url: '/test',
        method: 'POST' as const,
        data: { test: 'data' },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
      
      const result = requestInterceptor(config)
      
      expect(result.headers).toHaveProperty('Content-Type', 'multipart/form-data')
    })
  })

  describe('responseInterceptor', () => {
    it('returns data when response is successful', async () => {
      const mockResponse = new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'data' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await responseInterceptor(mockResponse)
      
      expect(result).toEqual({
        code: 200,
        message: 'success',
        data: { test: 'data' }
      })
    })

    it('throws error when response is not successful', async () => {
      const mockResponse = new Response(JSON.stringify({
        code: 400,
        message: 'bad request',
        error: 'invalid parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
      
      await expect(responseInterceptor(mockResponse)).rejects.toThrow('bad request')
    })

    it('handles 403 error by removing token and redirecting', async () => {
      // 设置token
      localStorage.setItem('token', 'test-token')
      
      // 模拟window.location.href
      delete (window as any).location
      window.location = { href: '' } as any
      
      const mockResponse = new Response(JSON.stringify({
        code: 403,
        message: 'forbidden',
        error: 'invalid token'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
      
      await expect(responseInterceptor(mockResponse)).rejects.toThrow('权限验证失败，请重新登录')
      
      // 验证token已被移除
      expect(localStorage.getItem('token')).toBeNull()
      // 验证已跳转到登录页面
      expect(window.location.href).toBe('/login')
    })
  })

  describe('handleError', () => {
    it('handles Error objects', () => {
      const error = new Error('test error')
      
      expect(() => handleError(error)).toThrow(error)
    })

    it('handles string errors', () => {
      const error = 'test error string'
      
      expect(() => handleError(error)).toThrow(error)
    })

    it('handles other types of errors', () => {
      const error = { test: 'error object' }
      
      expect(() => handleError(error)).toThrow('error object')
    })
  })

  describe('request', () => {
    it('sends GET request successfully', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'data' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await request({
        url: '/test',
        method: 'GET'
      })
      
      expect(result).toEqual({ test: 'data' })
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('sends POST request successfully', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'created' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await request({
        url: '/test',
        method: 'POST',
        data: { test: 'data' }
      })
      
      expect(result).toEqual({ test: 'created' })
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('HTTP methods', () => {
    it('get method works correctly', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'data' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await get('/test', { param1: 'value1', param2: 'value2' })
      
      expect(result).toEqual({ test: 'data' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test?param1=value1&param2=value2',
        expect.any(Object)
      )
    })

    it('post method works correctly', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'created' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await post('/test', { test: 'data' })
      
      expect(result).toEqual({ test: 'created' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' })
        })
      )
    })

    it('put method works correctly', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'updated' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await put('/test', { test: 'data' })
      
      expect(result).toEqual({ test: 'updated' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ test: 'data' })
        })
      )
    })

    it('del method works correctly', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { test: 'deleted' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await del('/test')
      
      expect(result).toEqual({ test: 'deleted' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('bisheng', () => {
    it('invoke method works correctly', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { workflow_id: 'test-workflow', session_id: 'test-session' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await bisheng.invoke('test-workflow', { param1: 'value1' })
      
      expect(result).toEqual({ workflow_id: 'test-workflow', session_id: 'test-session' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workflow/invoke',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ workflow_id: 'test-workflow', param1: 'value1' })
        })
      )
    })

    it('stop method works correctly', async () => {
      // 模拟成功响应
      ;(global.fetch as Mock).mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        message: 'success',
        data: { session_id: 'test-session', status: 'stopped' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      
      const result = await bisheng.stop('test-session')
      
      expect(result).toEqual({ session_id: 'test-session', status: 'stopped' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workflow/stop',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ session_id: 'test-session' })
        })
      )
    })
  })
})
