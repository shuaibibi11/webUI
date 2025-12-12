package com.example.webui.userapi.controller;

import com.example.webui.common.entity.Conversation;
import com.example.webui.common.entity.Message;
import com.example.webui.common.entity.User;
import com.example.webui.common.entity.ModelConfig;
import com.example.webui.common.entity.WorkflowConfig;
import com.example.webui.common.repo.ConversationRepository;
import com.example.webui.common.repo.MessageRepository;
import com.example.webui.common.repo.ModelConfigRepository;
import com.example.webui.common.repo.UserRepository;
import com.example.webui.common.repo.WorkflowConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping({"/chat"})
@SuppressWarnings("null")
public class ChatController {

    @Autowired private ConversationRepository conversationRepo;
    @Autowired private MessageRepository messageRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private ModelConfigRepository modelConfigRepo;
    @Autowired private WorkflowConfigRepository workflowConfigRepo;
    
    @Value("${bisheng.api.url:http://localhost:8000}")
    private String bishengApiUrl;
    
    @Value("${bisheng.api.key:test-key}")
    private String bishengApiKey;
    
    @Value("${bisheng.workflow.id:test-workflow}")
    private String bishengWorkflowId;
    
    private final ExecutorService executor = Executors.newCachedThreadPool();
    
    // 临时存储bisheng工作流的session信息（conversationId -> {sessionId, messageId, nodeId}）
    private final java.util.concurrent.ConcurrentHashMap<String, java.util.Map<String, String>> bishengSessions = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * 预热工作流连接
     * 在切换到使用工作流的会话时调用，提前唤醒工作流以减少首次响应延迟
     */
    @PostMapping("/warmup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> warmupWorkflow(Authentication auth, @RequestBody Map<String, Object> body) {
        String userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(err("用户认证信息无效"));

        String workflowId = getString(body, "workflowId");
        if (workflowId == null || workflowId.isBlank()) {
            return ResponseEntity.ok(Map.of("code", 200, "message", "无需预热"));
        }

        // 异步执行预热请求
        executor.execute(() -> {
            try {
                WorkflowConfig workflowConfig = workflowConfigRepo.findById(workflowId).orElse(null);
                if (workflowConfig == null || !workflowConfig.isEnabled()) {
                    System.out.println("预热失败：工作流配置不存在或未启用: " + workflowId);
                    return;
                }

                String apiUrl = workflowConfig.getEndpoint() != null ? workflowConfig.getEndpoint() : bishengApiUrl;
                String apiKey = workflowConfig.getApiKey() != null ? workflowConfig.getApiKey() : bishengApiKey;
                String actualWorkflowId = workflowConfig.getWorkflowId();

                System.out.println("开始预热工作流: " + workflowConfig.getName() + ", workflowId: " + actualWorkflowId);

                // 发送一个简单的预热请求到 bisheng
                // 使用一个特殊的标记表示这是预热请求
                String warmupUrl = apiUrl + "/api/v2/workflow/" + actualWorkflowId + "/stream";

                // 创建预热请求
                java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                        .connectTimeout(java.time.Duration.ofSeconds(5))
                        .build();

                // 发送一个HEAD请求或OPTIONS请求来唤醒服务
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(warmupUrl.replace("/stream", "")))
                        .header("Authorization", "Bearer " + apiKey)
                        .timeout(java.time.Duration.ofSeconds(5))
                        .method("OPTIONS", java.net.http.HttpRequest.BodyPublishers.noBody())
                        .build();

                client.sendAsync(request, java.net.http.HttpResponse.BodyHandlers.discarding())
                        .thenAccept(response -> {
                            System.out.println("预热完成，响应状态: " + response.statusCode());
                        })
                        .exceptionally(e -> {
                            System.out.println("预热请求完成（可能服务未启动）: " + e.getMessage());
                            return null;
                        });

            } catch (Exception e) {
                System.out.println("预热请求失败: " + e.getMessage());
            }
        });

        return ResponseEntity.ok(Map.of("code", 200, "message", "预热请求已发送"));
    }

    @PostMapping
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> chat(Authentication auth, @RequestBody Map<String, Object> body) {
        String userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(err("用户认证信息无效"));

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 检查用户是否被封禁
        if ("BANNED".equals(user.getStatus())) {
            if (user.getBannedUntil() != null && user.getBannedUntil().isAfter(java.time.Instant.now())) {
                // 临时封禁未过期
                long remainingMinutes = java.time.Duration.between(java.time.Instant.now(), user.getBannedUntil()).toMinutes();
                return ResponseEntity.status(403).body(err("您的账号因违规被临时封禁，剩余" + (remainingMinutes + 1) + "分钟后可继续使用"));
            } else if (user.getBannedUntil() != null) {
                // 临时封禁已过期，自动解封
                user.setStatus("ACTIVE");
                user.setBannedUntil(null);
                userRepo.save(user);
            } else {
                // 永久封禁
                return ResponseEntity.status(403).body(err("您的账号已被禁用，请联系管理员"));
            }
        }

        String conversationId = getString(body, "conversationId");
        String content = getString(body, "content");
        String modelId = getString(body, "modelId");
        
        Conversation c = getOrCreateConversation(user, conversationId, content);
        if (c == null) return ResponseEntity.status(404).body(err("对话不存在"));

        // 保存用户消息
        Message userMsg = createMessage(c, "user", content, "sent");
        messageRepo.save(userMsg);

        // 获取AI回复
        String aiContent = getAIResponse(content, modelId);
        
        // 保存AI消息
        Message aiMsg = createMessage(c, "assistant", aiContent, "sent");
        messageRepo.save(aiMsg);

        // 更新对话时间
        c.setUpdatedAt(Instant.now());
        conversationRepo.save(c);

        Map<String,Object> res = new HashMap<>();
        res.put("code", 201);
        res.put("message", "消息发送成功");
        res.put("conversationId", c.getId());
        res.put("messages", List.of(mapMsg(userMsg, userId), mapMsg(aiMsg, userId)));
        return ResponseEntity.status(201).body(res);
    }
    
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public SseEmitter streamChat(Authentication auth, @RequestBody Map<String, Object> body) throws IOException {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        
        String userId = getUserId(auth);
        if (userId == null) {
            sendError(emitter, "用户认证信息无效");
            return emitter;
        }
        
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) {
            sendError(emitter, "用户不存在");
            return emitter;
        }

        // 检查用户是否被封禁
        if ("BANNED".equals(user.getStatus())) {
            if (user.getBannedUntil() != null && user.getBannedUntil().isAfter(java.time.Instant.now())) {
                // 临时封禁未过期
                long remainingMinutes = java.time.Duration.between(java.time.Instant.now(), user.getBannedUntil()).toMinutes();
                sendError(emitter, "您的账号因违规被临时封禁，剩余" + (remainingMinutes + 1) + "分钟后可继续使用");
                return emitter;
            } else if (user.getBannedUntil() != null) {
                // 临时封禁已过期，自动解封
                user.setStatus("ACTIVE");
                user.setBannedUntil(null);
                userRepo.save(user);
            } else {
                // 永久封禁
                sendError(emitter, "您的账号已被禁用，请联系管理员");
                return emitter;
            }
        }

        String conversationId = getString(body, "conversationId");
        String content = getString(body, "content");
        String modelId = getString(body, "modelId");
        String workflowId = getString(body, "workflowId");
        
        executor.execute(() -> {
            try {
                Conversation c = getOrCreateConversation(user, conversationId, content);
                if (c == null) {
                    sendError(emitter, "对话不存在");
                    return;
                }

                // 如果会话标题是"新会话"或为空，用用户第一句话更新标题
                if (c.getTitle() == null || c.getTitle().isBlank() || "新会话".equals(c.getTitle())) {
                    String newTitle = content.length() > 20 ? content.substring(0, 20) + "..." : content;
                    c.setTitle(newTitle);
                }

                // 在保存消息之前计数，用于判断是否跳过欢迎语
                final long existingMsgCountBeforeSave = messageRepo.countByConversation(c);
                final boolean skipGuideWord = existingMsgCountBeforeSave > 0; // 如果已有消息，说明是历史对话
                System.out.println("会话历史消息数（保存前）: " + existingMsgCountBeforeSave + ", 跳过欢迎语: " + skipGuideWord);

                // 保存用户消息
                Message userMsg = createMessage(c, "user", content, "sent");
                messageRepo.save(userMsg);
                try {
                     System.out.println("发送用户消息SSE: " + mapMsg(userMsg, userId));
                     emitter.send(SseEmitter.event().name("message").data(mapMsg(userMsg, userId)));
                 } catch (Exception e) {
                     System.err.println("发送用户消息失败: " + e.getMessage());
                     sendError(emitter, "发送消息失败：" + e.getMessage());
                     return;
                 }
                 
                 // 创建AI消息（初始为空）
                 Message aiMsg = createMessage(c, "assistant", "", "generating");
                 messageRepo.save(aiMsg);
                 System.out.println("创建AI消息，ID: " + aiMsg.getId() + ", conversationId: " + c.getId());
                 
                // 判断是工作流还是大模型
                // 优先检查workflowId，如果提供了workflowId，使用工作流
                // 如果提供了modelId且不是工作流ID，使用大模型
                // 否则使用默认工作流
                boolean isWorkflow = false;
                String actualWorkflowId = bishengWorkflowId;
                String actualBishengApiUrl = bishengApiUrl;
                String actualBishengApiKey = bishengApiKey;
                
                System.out.println("判断模型类型 - workflowId: " + workflowId + ", modelId: " + modelId);
                
                if (workflowId != null && !workflowId.isBlank()) {
                    // 前端明确指定了工作流ID
                    isWorkflow = true;
                    System.out.println("检测到workflowId，使用工作流模式");
                    // 从数据库获取工作流配置
                    WorkflowConfig workflowConfig = workflowConfigRepo.findById(workflowId).orElse(null);
                    if (workflowConfig != null && workflowConfig.isEnabled()) {
                        actualWorkflowId = workflowConfig.getWorkflowId();
                        actualBishengApiUrl = workflowConfig.getEndpoint() != null ? workflowConfig.getEndpoint() : bishengApiUrl;
                        actualBishengApiKey = workflowConfig.getApiKey() != null ? workflowConfig.getApiKey() : bishengApiKey;
                        System.out.println("找到工作流配置: " + workflowConfig.getName() + ", workflowId: " + actualWorkflowId);
                    } else {
                        System.out.println("警告: 工作流配置不存在或未启用: " + workflowId);
                    }
                } else if (modelId != null && !modelId.isBlank()) {
                    // 检查modelId是否是工作流ID
                    WorkflowConfig workflowConfig = workflowConfigRepo.findById(modelId).orElse(null);
                    if (workflowConfig != null && workflowConfig.isEnabled()) {
                        // modelId实际上是工作流ID
                        isWorkflow = true;
                        System.out.println("modelId是工作流ID，使用工作流模式");
                        actualWorkflowId = workflowConfig.getWorkflowId();
                        actualBishengApiUrl = workflowConfig.getEndpoint() != null ? workflowConfig.getEndpoint() : bishengApiUrl;
                        actualBishengApiKey = workflowConfig.getApiKey() != null ? workflowConfig.getApiKey() : bishengApiKey;
                    } else {
                        // 是真正的模型ID
                        isWorkflow = false;
                        System.out.println("modelId是真正的模型ID，使用大模型模式");
                    }
                } else {
                    // 没有提供modelId或workflowId，使用默认工作流
                    isWorkflow = true;
                    System.out.println("未提供modelId或workflowId，使用默认工作流");
                }

                // 更新会话的模型/工作流信息（只在会话首次使用时设置）
                if (c.getModelId() == null && c.getWorkflowId() == null) {
                    if (isWorkflow) {
                        // 查找工作流配置获取名称
                        String wfIdToUse = workflowId != null && !workflowId.isBlank() ? workflowId : modelId;
                        if (wfIdToUse != null) {
                            WorkflowConfig wfConfig = workflowConfigRepo.findById(wfIdToUse).orElse(null);
                            if (wfConfig != null) {
                                c.setWorkflowId(wfIdToUse);
                                c.setWorkflowName(wfConfig.getName());
                            }
                        }
                    } else if (modelId != null && !modelId.isBlank()) {
                        // 查找模型配置获取名称
                        ModelConfig mConfig = modelConfigRepo.findById(modelId).orElse(null);
                        if (mConfig != null) {
                            c.setModelId(modelId);
                            // 优先使用tag作为显示名称，如果没有则使用modelName
                            c.setModelName(mConfig.getTag() != null ? mConfig.getTag() : mConfig.getModelName());
                        }
                    }
                }

                // 根据判断结果选择输出方式
                if (isWorkflow) {
                    // 工作流：流式输出
                    System.out.println("调用工作流流式输出，workflowId: " + actualWorkflowId + ", apiUrl: " + actualBishengApiUrl + ", 跳过欢迎语: " + skipGuideWord);
                    handleWorkflowStream(emitter, aiMsg, userId, content, actualWorkflowId, actualBishengApiUrl, actualBishengApiKey, skipGuideWord);
                } else {
                     // 大模型：一次性输出
                    System.out.println("调用大模型非流式输出，modelId: " + modelId);
                     handleModelNonStream(emitter, aiMsg, userId, content, modelId);
                 }
                 
                 // 更新对话时间
                 c.setUpdatedAt(Instant.now());
                 conversationRepo.save(c);
                 
                 try {
                     emitter.complete();
                 } catch (Exception e) {
                     // 忽略完成异常
                 }
             } catch (Exception e) {
                 sendError(emitter, "生成失败：" + e.getMessage());
             }
        });
        
        return emitter;
    }

    // 处理大模型非流式输出
    private void handleModelNonStream(SseEmitter emitter, Message aiMsg, String userId, String content, String modelId) {
        try {
            // 获取模型配置
            String modelApiUrl = "http://43.192.114.202:8000/v1/chat/completions";
            String modelApiKey = "123";
            String modelName = "Qwen3-4B-Instruct-2507-FP8";

            if (modelId != null && !modelId.isBlank()) {
                ModelConfig modelConfig = modelConfigRepo.findById(modelId).orElse(null);
                if (modelConfig != null && modelConfig.isEnabled()) {
                    modelApiUrl = modelConfig.getEndpoint();
                    modelApiKey = modelConfig.getApiKey();
                    modelName = modelConfig.getModelName();
                }
            }

            System.out.println("调用大模型API: url=" + modelApiUrl + ", model=" + modelName);

            // 构建请求
            Map<String, Object> request = new HashMap<>();
            request.put("model", modelName);
            request.put("stream", false);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", "你是一个有帮助的AI助手。"));
            messages.add(Map.of("role", "user", "content", content));
            request.put("messages", messages);
            request.put("temperature", 0.7);
            request.put("max_tokens", 1024);

            // 发送请求
            String response = sendHttpRequest(modelApiUrl, "POST", request, Map.of("Authorization", "Bearer " + modelApiKey));
            System.out.println("大模型响应: " + response.substring(0, Math.min(500, response.length())));

            // 解析响应
            String aiContent = parseModelResponse(response);

            // 更新消息并发送
            aiMsg.setContent(aiContent);
            aiMsg.setStatus("sent");
            messageRepo.save(aiMsg);
            try {
                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
            } catch (Exception ex) {
                // 忽略发送异常
            }

        } catch (java.net.SocketTimeoutException e) {
            // 超时错误 - 明确告知用户
            System.err.println("大模型API请求超时: " + e.getMessage());
            String errorContent = "抱歉，AI服务响应超时，请稍后再试。如果问题持续存在，请联系管理员检查模型服务状态。";
            aiMsg.setContent(errorContent);
            aiMsg.setStatus("error");
            messageRepo.save(aiMsg);
            try {
                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
            } catch (Exception ex) {
                // 忽略发送异常
            }
        } catch (java.net.ConnectException e) {
            // 连接错误 - 服务不可用
            System.err.println("大模型API连接失败: " + e.getMessage());
            String errorContent = "抱歉，无法连接到AI服务，服务可能暂时不可用。请稍后再试。";
            aiMsg.setContent(errorContent);
            aiMsg.setStatus("error");
            messageRepo.save(aiMsg);
            try {
                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
            } catch (Exception ex) {
                // 忽略发送异常
            }
        } catch (Exception e) {
            // 其他错误
            System.err.println("大模型调用失败: " + e.getMessage());
            e.printStackTrace();
            String errorContent = "抱歉，AI服务出现问题：" + e.getMessage() + "。请稍后再试。";
            aiMsg.setContent(errorContent);
            aiMsg.setStatus("error");
            messageRepo.save(aiMsg);
            try {
                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
            } catch (Exception ex) {
                // 忽略发送异常
            }
        }
    }

    // 处理工作流流式输出
    private void handleWorkflowStream(SseEmitter emitter, Message aiMsg, String userId, String content, String workflowId, String apiUrl, String apiKey, boolean skipGuideWord) {
        try {
            // 构建工作流请求URL
            String workflowUrl;
            if (apiUrl.contains("/api/v2/workflow/invoke") || apiUrl.contains("/api/v1/workflows/execute")) {
                workflowUrl = apiUrl;
            } else {
                workflowUrl = apiUrl + "/api/v2/workflow/invoke";
            }
            
            Conversation conv = aiMsg.getConversation();
            String conversationId = conv.getId();

            // 优先从数据库获取 session 信息，其次从内存缓存获取
            String sessionId = conv.getBishengSessionId();
            String messageId = conv.getBishengMessageId();
            String nodeId = conv.getBishengNodeId();

            // 如果数据库没有，尝试从内存缓存获取
            if (sessionId == null || messageId == null || nodeId == null) {
                java.util.Map<String, String> sessionInfo = bishengSessions.get(conversationId);
                if (sessionInfo != null) {
                    sessionId = sessionInfo.get("sessionId");
                    messageId = sessionInfo.get("messageId");
                    nodeId = sessionInfo.get("nodeId");
                }
            }

            // bisheng工作流请求格式：
            // 第一次调用：{"workflow_id":"...","stream":true} - 不传user_input，工作流会返回guide_word和input事件
            // 后续调用：{"workflow_id":"...","session_id":"...","message_id":"...","input":{"node_id":{"user_input":"..."}},"stream":true}
            Map<String, Object> request = new HashMap<>();
            request.put("workflow_id", workflowId);
            request.put("stream", true);

            if (sessionId != null && messageId != null && nodeId != null) {
                // 后续调用：使用input格式（用户已经输入了内容）
                request.put("session_id", sessionId);
                request.put("message_id", messageId);

                Map<String, Object> input = new HashMap<>();
                Map<String, Object> nodeInput = new HashMap<>();
                nodeInput.put("user_input", content);
                input.put(nodeId, nodeInput);
                request.put("input", input);

                System.out.println("后续调用 - session_id: " + sessionId + ", message_id: " + messageId + ", node_id: " + nodeId + ", user_input: " + content);
            } else if (content != null && !content.isEmpty()) {
                // 第一次调用但用户已经输入了内容：使用user_input方式（bisheng支持这种方式）
                // 注意：这种方式会跳过guide_word和input事件，直接处理用户输入
            request.put("user_input", content);
                System.out.println("第一次调用 - 使用user_input方式: " + content);
            } else {
                // 第一次调用且没有用户输入：只传workflow_id和stream
                System.out.println("第一次调用 - 不传user_input，等待工作流返回guide_word和input事件");
            }
            
            System.out.println("工作流请求URL: " + workflowUrl);
            System.out.println("工作流ID: " + workflowId);
            System.out.println("用户输入: " + content);
            System.out.println("请求体: " + new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request));
            
            // 发送流式请求
            sendStreamRequest(workflowUrl, request, Map.of("Authorization", "Bearer " + apiKey), 
                (eventType, eventData) -> {
                    try {
                        // bisheng API返回格式: {"session_id":"...","data":{"event":"...","status":"...","output_schema":{"message":"..."}}}
                        // 首先保存session_id（从根节点获取）
                        String sessionIdFromResponse = eventData.path("session_id").asText();
                        if (!sessionIdFromResponse.isEmpty()) {
                            String convId = aiMsg.getConversation().getId();
                            java.util.Map<String, String> sessInfo = bishengSessions.getOrDefault(convId, new HashMap<>());
                            if (!sessInfo.containsKey("sessionId")) {
                                sessInfo.put("sessionId", sessionIdFromResponse);
                                bishengSessions.put(convId, sessInfo);
                                System.out.println("保存session_id: " + sessionIdFromResponse);
                            }
                        }
                        
                        com.fasterxml.jackson.databind.JsonNode dataNode = eventData.path("data");
                        if (dataNode.isMissingNode()) {
                            dataNode = eventData;
                        }
                        
                        String actualEventType = dataNode.path("event").asText();
                        if (actualEventType.isEmpty()) {
                            actualEventType = eventType;
                        }
                        
                        // 获取status字段（用于stream_msg事件）
                        String status = dataNode.path("status").asText();
                        
                        System.out.println("处理bisheng事件: event=" + actualEventType + ", status=" + status + ", session_id=" + sessionIdFromResponse);
                        
                        switch (actualEventType) {
                            case "stream_msg":
                                // 流式输出事件：根据status字段判断是流式输出中还是结束
                                // 参考代码：value.data.status === 'stream' 表示流式输出中，value.data.status === 'end' 表示流式输出结束
                                com.fasterxml.jackson.databind.JsonNode streamOutputSchema = dataNode.path("output_schema");
                                if (!streamOutputSchema.isMissingNode()) {
                                    com.fasterxml.jackson.databind.JsonNode streamMessageNode = streamOutputSchema.path("message");
                                    String streamMessage = "";
                                    
                                    if (streamMessageNode.isTextual()) {
                                        streamMessage = streamMessageNode.asText();
                                    } else if (streamMessageNode.isArray() && streamMessageNode.size() > 0) {
                                        streamMessage = streamMessageNode.get(0).asText();
                                    }
                                    
                                    if (!streamMessage.isEmpty()) {
                                        String currentContent = aiMsg.getContent() != null ? aiMsg.getContent() : "";
                                        
                                        if ("stream".equals(status)) {
                                            // 流式输出中：追加内容
                                            aiMsg.setContent(currentContent + streamMessage);
                                            aiMsg.setStatus("generating");
                                        } else if ("end".equals(status)) {
                                            // 流式输出结束：使用最终完整内容覆盖
                                            aiMsg.setContent(streamMessage);
                                            aiMsg.setStatus("sent");
                                        } else {
                                            // 如果没有status字段，默认追加
                                            aiMsg.setContent(currentContent + streamMessage);
                                            aiMsg.setStatus("generating");
                                        }
                                        
                                        messageRepo.save(aiMsg);
                                        try {
                                            System.out.println("发送stream_msg: event=" + actualEventType + ", status=" + status + ", 内容长度=" + (aiMsg.getContent() != null ? aiMsg.getContent().length() : 0));
                                            Map<String,Object> msgData = mapMsg(aiMsg, userId);
                                            System.out.println("发送SSE消息数据: " + new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(msgData));
                                            // 确保每次流式更新都发送SSE事件
                                            emitter.send(SseEmitter.event().name("message").data(msgData));
                                        } catch (Exception ex) {
                                            System.err.println("发送SSE消息失败: " + ex.getMessage());
                                            ex.printStackTrace();
                                        }
                                    }
                                }
                                break;
                                
                        case "guide_word":
                                // 开场白事件：直接设置消息内容（这是工作流的初始问候语）
                                // 如果是历史对话（skipGuideWord=true），跳过欢迎语
                                if (skipGuideWord) {
                                    System.out.println("跳过guide_word（历史对话）");
                                    break;
                                }
                                com.fasterxml.jackson.databind.JsonNode guideOutputSchema = dataNode.path("output_schema");
                                if (!guideOutputSchema.isMissingNode()) {
                                    com.fasterxml.jackson.databind.JsonNode guideMessageNode = guideOutputSchema.path("message");
                                    if (guideMessageNode.isTextual()) {
                                        String guideMessage = guideMessageNode.asText();
                                        if (!guideMessage.isEmpty()) {
                                            // guide_word是开场白，直接设置内容
                                            aiMsg.setContent(guideMessage);
                                            aiMsg.setStatus("generating"); // 设置为生成中，等待后续消息
                                            messageRepo.save(aiMsg);
                                            try {
                                                System.out.println("发送guide_word: " + guideMessage);
                                                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
                                            } catch (Exception ex) {
                                                System.err.println("发送SSE消息失败: " + ex.getMessage());
                                                ex.printStackTrace();
                                            }
                                        }
                                    }
                                }
                                break;
                                
                        case "output_msg":
                                // 输出事件：设置消息内容并标记为sent（工作流输出完成）
                                com.fasterxml.jackson.databind.JsonNode outputSchema = dataNode.path("output_schema");
                                if (!outputSchema.isMissingNode()) {
                                    com.fasterxml.jackson.databind.JsonNode messageNode = outputSchema.path("message");
                                    String message = "";

                                    if (messageNode.isTextual()) {
                                        message = messageNode.asText();
                                    } else if (messageNode.isArray() && messageNode.size() > 0) {
                                        message = messageNode.get(0).asText();
                                    }

                                    if (!message.isEmpty() && !message.equals("['']") && !message.equals("[]")) {
                                        String currentContent = aiMsg.getContent() != null ? aiMsg.getContent() : "";
                                        aiMsg.setContent(currentContent.isEmpty() ? message : currentContent + message);
                                        // output_msg事件表示输出完成，设置状态为sent
                                        aiMsg.setStatus("sent");
                                        messageRepo.save(aiMsg);
                                        try {
                                            System.out.println("发送output_msg: " + message + ", 状态: sent");
                                            emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
                                        } catch (Exception ex) {
                                            System.err.println("发送SSE消息失败: " + ex.getMessage());
                                        }
                                    }
                                }
                                break;
                                
                             case "close":
                            case "end":
                                // 结束事件
                                 aiMsg.setStatus("sent");
                                 messageRepo.save(aiMsg);
                                 try {
                                     emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
                                 } catch (Exception ex) {
                                     // 忽略发送异常
                                 }
                                 break;
                                
                             case "error":
                                // 错误事件
                                String errorMsg = "生成失败";
                                com.fasterxml.jackson.databind.JsonNode errorOutputSchema = dataNode.path("output_schema");
                                if (!errorOutputSchema.isMissingNode()) {
                                    errorMsg = errorOutputSchema.path("message").asText();
                                }
                                 try {
                                     emitter.send(SseEmitter.event().name("error").data(err("生成失败：" + errorMsg)));
                                 } catch (Exception ex) {
                                     // 忽略发送异常
                                 }
                                 break;
                                
                            case "input":
                                // 等待输入事件：保存session_id、message_id和node_id用于后续调用
                                // 同时，收到input事件表示当前轮对话完成，将消息状态设为sent
                                String inputSessionId = eventData.path("session_id").asText();
                                String inputMessageId = dataNode.path("message_id").asText();
                                String inputNodeId = dataNode.path("node_id").asText();

                                if (!inputSessionId.isEmpty() && !inputMessageId.isEmpty() && !inputNodeId.isEmpty()) {
                                    String convId = aiMsg.getConversation().getId();
                                    // 保存到内存缓存
                                    java.util.Map<String, String> sessInfo = new HashMap<>();
                                    sessInfo.put("sessionId", inputSessionId);
                                    sessInfo.put("messageId", inputMessageId);
                                    sessInfo.put("nodeId", inputNodeId);
                                    bishengSessions.put(convId, sessInfo);
                                    // 同时保存到数据库（持久化）
                                    Conversation convToUpdate = aiMsg.getConversation();
                                    convToUpdate.setBishengSessionId(inputSessionId);
                                    convToUpdate.setBishengMessageId(inputMessageId);
                                    convToUpdate.setBishengNodeId(inputNodeId);
                                    conversationRepo.save(convToUpdate);
                                    System.out.println("保存bisheng session信息到数据库: conversationId=" + convId + ", session_id=" + inputSessionId + ", message_id=" + inputMessageId + ", node_id=" + inputNodeId);
                                }

                                // 收到input事件表示工作流等待新输入，当前轮对话完成
                                // 如果消息有内容，设置状态为sent
                                if (aiMsg.getContent() != null && !aiMsg.getContent().isEmpty() && "generating".equals(aiMsg.getStatus())) {
                                    aiMsg.setStatus("sent");
                                    messageRepo.save(aiMsg);
                                    try {
                                        System.out.println("收到input事件，设置消息状态为sent");
                                        emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
                                    } catch (Exception ex) {
                                        System.err.println("发送SSE消息失败: " + ex.getMessage());
                                    }
                                }
                                break;
                                
                            default:
                                // 对于其他事件类型，尝试提取消息
                                // 特别处理：如果status="stream"，说明是流式输出中
                                if ("stream".equals(status)) {
                                    com.fasterxml.jackson.databind.JsonNode defaultOutputSchema = dataNode.path("output_schema");
                                    if (!defaultOutputSchema.isMissingNode()) {
                                        com.fasterxml.jackson.databind.JsonNode defaultMessageNode = defaultOutputSchema.path("message");
                                        String defaultMessage = "";
                                        
                                        if (defaultMessageNode.isTextual()) {
                                            defaultMessage = defaultMessageNode.asText();
                                        } else if (defaultMessageNode.isArray() && defaultMessageNode.size() > 0) {
                                            defaultMessage = defaultMessageNode.get(0).asText();
                                        }
                                        
                                        if (!defaultMessage.isEmpty() && !defaultMessage.equals("['']") && !defaultMessage.equals("[]")) {
                                            String currentContent = aiMsg.getContent() != null ? aiMsg.getContent() : "";
                                            aiMsg.setContent(currentContent + defaultMessage);
                                            aiMsg.setStatus("generating");
                                            messageRepo.save(aiMsg);
                                            try {
                                                System.out.println("发送流式事件(默认): event=" + actualEventType + ", status=" + status + ", 内容: " + defaultMessage);
                                                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
                                            } catch (Exception ex) {
                                                System.err.println("发送SSE消息失败: " + ex.getMessage());
                                            }
                                        }
                                    }
                                } else {
                                    // 非流式事件，尝试提取消息
                                    com.fasterxml.jackson.databind.JsonNode defaultOutputSchema = dataNode.path("output_schema");
                                    if (!defaultOutputSchema.isMissingNode()) {
                                        com.fasterxml.jackson.databind.JsonNode defaultMessageNode = defaultOutputSchema.path("message");
                                        String defaultMessage = "";
                                        
                                        if (defaultMessageNode.isTextual()) {
                                            defaultMessage = defaultMessageNode.asText();
                                        } else if (defaultMessageNode.isArray() && defaultMessageNode.size() > 0) {
                                            defaultMessage = defaultMessageNode.get(0).asText();
                                        }
                                        
                                        if (!defaultMessage.isEmpty() && !defaultMessage.equals("['']") && !defaultMessage.equals("[]")) {
                                            String currentContent = aiMsg.getContent() != null ? aiMsg.getContent() : "";
                                            aiMsg.setContent(currentContent.isEmpty() ? defaultMessage : currentContent + defaultMessage);
                                            messageRepo.save(aiMsg);
                                            try {
                                                System.out.println("发送默认事件: " + actualEventType + ", 内容: " + defaultMessage);
                                                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
                                            } catch (Exception ex) {
                                                System.err.println("发送SSE消息失败: " + ex.getMessage());
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                    } catch (Exception e) {
                        System.err.println("处理bisheng事件失败: " + e.getMessage());
                        e.printStackTrace();
                    }
                });
                
                // 等待流式请求完成（设置超时）
                // 注意：sendStreamRequest是同步的，但实际处理是异步的
                // 这里不需要等待，因为事件处理已经在回调中完成
                
        } catch (Exception e) {
            System.err.println("工作流请求异常: " + e.getMessage());
            e.printStackTrace();
            // 失败时使用默认回复
            String defaultContent = "工作流处理失败：" + e.getMessage();
            aiMsg.setContent(defaultContent);
            aiMsg.setStatus("error");
            messageRepo.save(aiMsg);
            try {
                emitter.send(SseEmitter.event().name("message").data(mapMsg(aiMsg, userId)));
            } catch (Exception ex) {
                System.err.println("发送错误消息失败: " + ex.getMessage());
            }
        } finally {
            // 确保流式请求完成后，如果消息状态还是generating，标记为sent
            try {
                if ("generating".equals(aiMsg.getStatus())) {
                    // 等待一段时间后，如果还是generating，标记为sent
                    // 这里不等待，让事件处理回调来更新状态
                }
            } catch (Exception e) {
                // 忽略
            }
        }
    }

    // 辅助方法
    private String getUserId(Authentication auth) {
        if (auth.getDetails() instanceof Map) {
            Map<?, ?> details = (Map<?, ?>) auth.getDetails();
            return java.util.Objects.toString(details.get("userId"), null);
        }
        return null;
    }
    
    private String getString(Map<String, Object> body, String key) {
        return Optional.ofNullable(body.get(key)).map(Object::toString).orElse(null);
    }
    
    private Conversation getOrCreateConversation(User user, String conversationId, String content) {
        if (conversationId != null && !conversationId.isBlank()) {
            return conversationRepo.findByIdAndUser(conversationId, user).orElse(null);
        } else {
            String title = content.length() > 20 ? content.substring(0, 20) + "..." : content;
            Conversation c = new Conversation();
            c.setUser(user);
            c.setTitle(title);
            conversationRepo.save(c);
            return c;
        }
    }
    
    private Message createMessage(Conversation c, String role, String content, String status) {
        Message msg = new Message();
        msg.setConversation(c);
        msg.setRole(role);
        msg.setContent(content);
        msg.setStatus(status);
        return msg;
    }
    
    private String getAIResponse(String content, String modelId) {
        try {
            String modelApiUrl = "http://43.192.114.202:8000/v1/chat/completions";
            String modelApiKey = "123";
            String modelName = "Qwen3-4B-Instruct-2507-FP8";
            
            if (modelId != null && !modelId.isBlank()) {
                ModelConfig modelConfig = modelConfigRepo.findById(modelId).orElse(null);
                if (modelConfig != null && modelConfig.isEnabled()) {
                    modelApiUrl = modelConfig.getEndpoint();
                    modelApiKey = modelConfig.getApiKey();
                    modelName = modelConfig.getModelName();
                }
            }
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", modelName);
            
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", "你是一个有帮助的AI助手。"));
            messages.add(Map.of("role", "user", "content", content));
            request.put("messages", messages);
            request.put("temperature", 0.7);
            request.put("max_tokens", 1024);
            
            String response = sendHttpRequest(modelApiUrl, "POST", request, Map.of("Authorization", "Bearer " + modelApiKey));
            return parseModelResponse(response);
            
        } catch (Exception e) {
            return "这是AI对\"" + content + "\"的回复。";
        }
    }
    
    private String sendHttpRequest(String url, String method, Map<String, Object> body, Map<String, String> headers) throws Exception {
        java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
        connection.setRequestMethod(method);
        connection.setRequestProperty("Content-Type", "application/json");
        headers.forEach(connection::setRequestProperty);
        connection.setDoOutput(true);
        // 设置超时时间：连接超时10秒，读取超时30秒
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(30000);

        try (java.io.OutputStream os = connection.getOutputStream()) {
            byte[] input = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(body);
            os.write(input, 0, input.length);
        } catch (IOException e) {
            throw new IOException("Failed to write request body: " + e.getMessage(), e);
        }

        int responseCode = connection.getResponseCode();
        if (responseCode != 200) {
            // 读取错误响应
            try (java.io.BufferedReader br = new java.io.BufferedReader(
                new java.io.InputStreamReader(connection.getErrorStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder errorResponse = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    errorResponse.append(line);
                }
                throw new IOException("HTTP error " + responseCode + ": " + errorResponse.toString());
            }
        }

        try (java.io.BufferedReader br = new java.io.BufferedReader(
            new java.io.InputStreamReader(connection.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                response.append(line);
            }
            return response.toString();
        } catch (IOException e) {
            throw new IOException("Failed to read response: " + e.getMessage(), e);
        } finally {
            connection.disconnect();
        }
    }
    
    private String parseModelResponse(String response) throws Exception {
        com.fasterxml.jackson.databind.JsonNode responseNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(response);
        return responseNode.path("choices").get(0).path("message").path("content").asText();
    }
    
    private void sendStreamRequest(String url, Map<String, Object> body, Map<String, String> headers,
                                  StreamEventHandler handler) throws Exception {
        java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        headers.forEach(connection::setRequestProperty);
        connection.setDoOutput(true);
        connection.setChunkedStreamingMode(0);
        // 设置超时时间：连接超时10秒，读取超时60秒（流式请求需要更长时间）
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(60000);
        
        try (java.io.OutputStream os = connection.getOutputStream()) {
            byte[] input = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(body);
            os.write(input, 0, input.length);
        } catch (IOException e) {
            throw new IOException("Failed to write request body: " + e.getMessage(), e);
        }
        
        try (java.io.BufferedReader br = new java.io.BufferedReader(
            new java.io.InputStreamReader(connection.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            StringBuilder buffer = new StringBuilder();
            
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue; // 跳过空行
                }
                
                System.out.println("收到bisheng原始行: " + line);
                
                // 处理SSE格式: data: {...}
                if (line.startsWith("data: ")) {
                    String jsonData = line.substring(6).trim();
                    if (!jsonData.isEmpty()) {
                        try {
                            System.out.println("解析bisheng JSON数据: " + jsonData);
                            com.fasterxml.jackson.databind.JsonNode eventNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(jsonData);
                            // bisheng API返回格式: {"session_id":"...","data":{"event":"...","status":"..."}}
                            // 从data节点获取event类型，如果没有data节点则从根节点获取
                            com.fasterxml.jackson.databind.JsonNode dataNode = eventNode.path("data");
                            String eventType = "";
                            if (!dataNode.isMissingNode()) {
                                eventType = dataNode.path("event").asText();
                            } else {
                                eventType = eventNode.path("event").asText();
                            }
                            
                            // 如果没有event字段，尝试从status判断（可能是stream_msg事件）
                            if (eventType.isEmpty() && !dataNode.isMissingNode()) {
                                String status = dataNode.path("status").asText();
                                if ("stream".equals(status) || "end".equals(status)) {
                                    eventType = "stream_msg";
                                }
                            }
                            
                            if (!eventType.isEmpty()) {
                                System.out.println("处理bisheng事件: " + eventType + ", 原始数据: " + jsonData.substring(0, Math.min(200, jsonData.length())));
                                handler.handleEvent(eventType, eventNode);
                            } else {
                                System.out.println("警告: 无法提取事件类型，原始数据: " + jsonData.substring(0, Math.min(200, jsonData.length())));
                                // 即使没有event类型，也尝试处理（可能是其他格式）
                                handler.handleEvent("unknown", eventNode);
                            }
                        } catch (Exception e) {
                            System.err.println("解析SSE数据失败: " + jsonData.substring(0, Math.min(200, jsonData.length())) + ", 错误: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                } else if (!line.trim().isEmpty()) {
                    // 如果不是data:开头且不是空行，可能是多行JSON的一部分，累积到buffer
                    buffer.append(line);
                }
                
                // 如果buffer有内容且当前行是空行或新的事件开始，尝试解析buffer
                if (buffer.length() > 0 && (line.trim().isEmpty() || line.startsWith("data: "))) {
                    try {
                        String jsonData = buffer.toString();
                        com.fasterxml.jackson.databind.JsonNode eventNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(jsonData);
                        com.fasterxml.jackson.databind.JsonNode dataNode = eventNode.path("data");
                        String eventType = "";
                        if (!dataNode.isMissingNode()) {
                            eventType = dataNode.path("event").asText();
                        } else {
                            eventType = eventNode.path("event").asText();
                        }
                        if (!eventType.isEmpty()) {
                        handler.handleEvent(eventType, eventNode);
                    }
                    buffer.setLength(0);
                    } catch (Exception e) {
                        // 如果解析失败，清空buffer继续
                        buffer.setLength(0);
                    }
                }
            }
        } catch (IOException e) {
            throw new IOException("Failed to read response: " + e.getMessage(), e);
        } finally {
            connection.disconnect();
        }
    }
    
    private void sendError(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().name("error").data(err(message)));
            emitter.complete();
        } catch (Exception e) {
            // 忽略
        }
    }
    
    private static Map<String,Object> mapMsg(Message m, String userId) {
        return Map.of(
                "id", m.getId(),
                "conversationId", m.getConversation().getId(),
                "role", m.getRole(),
                "senderId", m.getRole().equals("user") ? userId : "assistant",
                "content", m.getContent(),
                "status", m.getStatus(),
                "createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMessageById(@PathVariable String id, Authentication auth) {
        String userId = getUserId(auth);
        Optional<Message> messageOpt = messageRepo.findById(id);
        if (messageOpt.isEmpty()) {
            return ResponseEntity.status(404).body(err("消息不存在"));
        }
        Message message = messageOpt.get();
        return ResponseEntity.ok(Map.of(
                "code", 200,
                "message", "获取成功",
                "data", mapMsg(message, userId)
        ));
    }

    private static Map<String,Object> err(String msg){ 
        Map<String,Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }
    
    // 流式事件处理接口
    @FunctionalInterface
    private interface StreamEventHandler {
        void handleEvent(String eventType, com.fasterxml.jackson.databind.JsonNode eventData);
    }
}