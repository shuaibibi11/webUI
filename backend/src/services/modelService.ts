import axios from 'axios'
import { prisma } from '../models/prisma'

export type ModelInvokeResult = {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export async function invokeModel(prompt: string): Promise<ModelInvokeResult> {
  const activeModel = await prisma.modelConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' } })
  let content = `这是AI对"${prompt}"的回复。`
  let promptTokens = 0
  let completionTokens = 0
  let totalTokens = 0
  if (!activeModel || !activeModel.endpoint || !activeModel.modelName) {
    return { content, promptTokens, completionTokens, totalTokens }
  }
  try {
    const headers: any = { 'Content-Type': 'application/json' }
    if (activeModel.apiKey) headers['Authorization'] = `Bearer ${activeModel.apiKey}`
    let resp: any
    if (activeModel.protocol === 'openai') {
      const body: any = {
        model: activeModel.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: activeModel.temperature,
        max_tokens: activeModel.maxTokens,
        top_p: activeModel.topP,
      }
      resp = await axios.post(activeModel.endpoint, body, { headers, timeout: 15000 })
      content = resp.data?.choices?.[0]?.message?.content || content
      promptTokens = resp.data?.usage?.prompt_tokens || 0
      completionTokens = resp.data?.usage?.completion_tokens || 0
      totalTokens = resp.data?.usage?.total_tokens || promptTokens + completionTokens
    } else if (activeModel.protocol === 'ollama') {
      const body: any = { model: activeModel.modelName, prompt, stream: false, options: { temperature: activeModel.temperature } }
      resp = await axios.post(activeModel.endpoint, body, { headers, timeout: 15000 })
      content = resp.data?.response || resp.data?.output || content
      totalTokens = resp.data?.eval_count || 0
    } else if (activeModel.protocol === 'siliconflow') {
      const body: any = { model: activeModel.modelName, messages: [{ role: 'user', content: prompt }], temperature: activeModel.temperature, top_p: activeModel.topP }
      resp = await axios.post(activeModel.endpoint, body, { headers, timeout: 15000 })
      content = resp.data?.choices?.[0]?.message?.content || content
      promptTokens = resp.data?.usage?.prompt_tokens || 0
      completionTokens = resp.data?.usage?.completion_tokens || 0
      totalTokens = resp.data?.usage?.total_tokens || promptTokens + completionTokens
    } else {
      const body: any = { model: activeModel.modelName, prompt, temperature: activeModel.temperature, max_tokens: activeModel.maxTokens, top_p: activeModel.topP }
      resp = await axios.post(activeModel.endpoint, body, { headers, timeout: 15000 })
      content = resp.data?.choices?.[0]?.text || resp.data?.output || resp.data?.text || content
      promptTokens = resp.data?.usage?.prompt_tokens || 0
      completionTokens = resp.data?.usage?.completion_tokens || 0
      totalTokens = resp.data?.usage?.total_tokens || promptTokens + completionTokens
    }
  } catch (e) {
  }
  return { content, promptTokens, completionTokens, totalTokens }
}

