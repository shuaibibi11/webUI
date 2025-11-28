import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../models/prisma';
import axios from 'axios';

export const chatValidation = [
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('消息内容长度必须在1-10000个字符之间')
    .trim(),
  body('conversationId')
    .optional()
    .isString()
    .withMessage('会话ID必须是字符串')
];

export const chatHandler = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array().map(err => err.msg)
      });
    }

    const userId = req.user.userId;
    let { conversationId, content } = req.body;

    let conversation;

    // 如果提供了 conversationId，验证其存在性
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, userId }
      });

      if (!conversation) {
        return res.status(404).json({ error: '对话不存在' });
      }
    } else {
      // 如果没有提供 conversationId，创建一个新对话
      // 使用消息内容的前20个字符作为标题
      const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title
        }
      });
      conversationId = conversation.id;
    }

    // 创建用户消息
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
        status: 'sent'
      }
    });

    // 调用模型配置
    const activeModel = await prisma.modelConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' } });
    let aiContent = `这是AI对"${content}"的回复。`;
    let promptTokens = 0, completionTokens = 0, totalTokens = 0;
    if (activeModel?.endpoint && activeModel?.modelName) {
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (activeModel.apiKey) headers['Authorization'] = `Bearer ${activeModel.apiKey}`;
        let resp;
        if (activeModel.protocol === 'openai') {
          const reqBody: any = {
            model: activeModel.modelName,
            messages: [{ role: 'user', content }],
            temperature: activeModel.temperature,
            max_tokens: activeModel.maxTokens,
            top_p: activeModel.topP,
          };
          resp = await axios.post(activeModel.endpoint, reqBody, { headers, timeout: 15000 });
          aiContent = resp.data?.choices?.[0]?.message?.content || aiContent;
          promptTokens = resp.data?.usage?.prompt_tokens || 0;
          completionTokens = resp.data?.usage?.completion_tokens || 0;
          totalTokens = resp.data?.usage?.total_tokens || promptTokens + completionTokens;
        } else if (activeModel.protocol === 'ollama') {
          const reqBody: any = { model: activeModel.modelName, prompt: content, stream: false, options: { temperature: activeModel.temperature } };
          resp = await axios.post(activeModel.endpoint, reqBody, { headers, timeout: 15000 });
          aiContent = resp.data?.response || resp.data?.output || aiContent;
          totalTokens = resp.data?.eval_count || 0;
        } else if (activeModel.protocol === 'siliconflow') {
          const reqBody: any = { model: activeModel.modelName, messages: [{ role: 'user', content }], temperature: activeModel.temperature, top_p: activeModel.topP };
          resp = await axios.post(activeModel.endpoint, reqBody, { headers, timeout: 15000 });
          aiContent = resp.data?.choices?.[0]?.message?.content || aiContent;
          promptTokens = resp.data?.usage?.prompt_tokens || 0;
          completionTokens = resp.data?.usage?.completion_tokens || 0;
          totalTokens = resp.data?.usage?.total_tokens || promptTokens + completionTokens;
        } else {
          // 自定义：兼容简单 text/choices[0].text/output
          const reqBody: any = { model: activeModel.modelName, prompt: content, temperature: activeModel.temperature, max_tokens: activeModel.maxTokens, top_p: activeModel.topP };
          resp = await axios.post(activeModel.endpoint, reqBody, { headers, timeout: 15000 });
          aiContent = resp.data?.choices?.[0]?.text || resp.data?.output || resp.data?.text || aiContent;
          promptTokens = resp.data?.usage?.prompt_tokens || 0;
          completionTokens = resp.data?.usage?.completion_tokens || 0;
          totalTokens = resp.data?.usage?.total_tokens || promptTokens + completionTokens;
        }
      } catch (e) {
        console.error('模型调用失败:', (e as any)?.message);
      }
    }

    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiContent,
        status: 'sent',
        promptTokens,
        completionTokens,
        totalTokens
      }
    });

    // 更新对话的更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message: '消息发送成功', conversationId, messages: [userMessage, aiMessage] });

  } catch (error) {
    console.error('聊天请求失败:', error);
    res.status(500).json({ error: '聊天请求失败，请稍后重试' });
  }
};
