package com.example.webui.userapi.controller;

import com.example.webui.common.entity.Conversation;
import com.example.webui.common.entity.Message;
import com.example.webui.common.entity.User;
import com.example.webui.common.repo.ConversationRepository;
import com.example.webui.common.repo.MessageRepository;
import com.example.webui.common.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.Optional;

@RestController
@RequestMapping({"/messages", "/api/messages"})
@SuppressWarnings("null")
public class MessageController {

    @Autowired private ConversationRepository conversationRepo;
    @Autowired private MessageRepository messageRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private com.example.webui.common.repo.ModelConfigRepository modelConfigRepo;
    @Autowired private com.example.webui.common.repo.UserActionLogRepository userActionLogRepo;

    @PostMapping
    @Transactional
    public ResponseEntity<?> send(@RequestBody Map<String, String> body) {
        // 从SecurityContext获取认证信息
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("未认证"));
        }
        
        // 从认证信息中获取用户ID
        String userId = null;
        String username = null;
        if (auth.getDetails() instanceof Map) {
            Map<?, ?> details = (Map<?, ?>) auth.getDetails();
            userId = java.util.Objects.toString(details.get("userId"), null);
            username = java.util.Objects.toString(details.get("username"), null);
        }
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("无效的访问令牌"));
        }
        
        // 尝试通过用户名查找用户
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            // 如果通过用户名找不到，尝试通过userId查找
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        String conversationId = body.getOrDefault("conversationId", "");
        String content = Optional.ofNullable(body.get("content")).orElse("");
        String modelId = Optional.ofNullable(body.get("modelId")).orElse(null);
        
        if (conversationId.isBlank()) return ResponseEntity.badRequest().body(err("会话ID不能为空"));
        Conversation c = conversationRepo.findByIdAndUser(conversationId, user).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("对话不存在"));

        Message userMsg = new Message();
        userMsg.setConversation(c);
        userMsg.setRole("user");
        userMsg.setContent(content);
        userMsg.setStatus("sent");
        messageRepo.save(userMsg);

        // 调用大模型API获取AI回复
        String aiContent = callModelApi(content, modelId);

        Message aiMsg = new Message();
        aiMsg.setConversation(c);
        aiMsg.setRole("assistant");
        aiMsg.setContent(aiContent);
        aiMsg.setStatus("sent");
        messageRepo.save(aiMsg);

        c.setUpdatedAt(Instant.now());
        conversationRepo.save(c);

        Map<String,Object> res = new HashMap<>();
        res.put("code", 201);
        res.put("message", Map.of(
                "id", userMsg.getId(),
                "conversationId", c.getId(),
                "role", "user",
                "content", userMsg.getContent(),
                "status", userMsg.getStatus(),
                "createdAt", toStr(userMsg.getCreatedAt())
        ));
        return ResponseEntity.status(201).body(res);
    }

    /**
     * 调用大模型API获取AI回复
     */
    private String callModelApi(String content, String modelId) {
        try {
            // 构建大模型API请求
            String modelApiUrl = "http://43.192.114.202:8000/v1/chat/completions";
            String modelApiKey = "123";
            String modelName = "Qwen3-4B-Instruct-2507-FP8";
            
            // 如果用户指定了模型ID，则使用该模型的配置
            if (modelId != null && !modelId.isBlank()) {
                com.example.webui.common.entity.ModelConfig modelConfig = modelConfigRepo.findById(modelId).orElse(null);
                if (modelConfig != null && modelConfig.isEnabled()) {
                    modelApiUrl = modelConfig.getEndpoint();
                    modelApiKey = modelConfig.getApiKey();
                    modelName = modelConfig.getModelName();
                }
            }
            
            // 创建HTTP客户端和请求
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URL(modelApiUrl).openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + modelApiKey);
            connection.setDoOutput(true);
            
            // 构建请求体
            Map<String, Object> modelRequest = new HashMap<>();
            modelRequest.put("model", modelName);
            
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", "你是一个有帮助的AI助手。"));
            messages.add(Map.of("role", "user", "content", content));
            modelRequest.put("messages", messages);
            modelRequest.put("temperature", 0.7);
            modelRequest.put("max_tokens", 1024);
            
            // 发送请求体
            try (java.io.OutputStream os = connection.getOutputStream()) {
                byte[] input = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(modelRequest);
                os.write(input, 0, input.length);
            }
            
            // 读取响应
            try (java.io.BufferedReader br = new java.io.BufferedReader(
                new java.io.InputStreamReader(connection.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                
                // 解析响应
                com.fasterxml.jackson.databind.JsonNode responseNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(response.toString());
                return responseNode.path("choices").get(0).path("message").path("content").asText();
            } finally {
                connection.disconnect();
            }
        } catch (Exception e) {
            // 如果大模型API调用失败，使用默认回复
            System.err.println("大模型API调用失败: " + e.getMessage());
            return "这是AI对\"" + content + "\"的回复。";
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> list(@PathVariable String conversationId,
                                  @RequestParam(value = "page", defaultValue = "1") int page,
                                  @RequestParam(value = "limit", defaultValue = "50") int limit,
                                  @RequestParam(value = "before", required = false) String before,
                                  Authentication auth) {
        try {
            System.out.println("DEBUG: list method called with conversationId: " + conversationId);
            
            // 检查认证状态
            if (auth == null || auth.getDetails() == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "code", 401,
                    "error", "未认证",
                    "message", "请先登录"
                ));
            }
            
            String userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
            String username = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("username"), null);
            
            System.out.println("DEBUG: Using userId: " + userId + ", username: " + username);
            
            // 查找用户
            User user = userRepo.findByUsername(username).orElse(null);
            if (user == null) {
                user = userRepo.findById(userId).orElse(null);
            }
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "code", 401,
                    "error", "用户不存在",
                    "message", "用户不存在或已被删除"
                ));
            }
            
            // 查找对话 - 确保用户只能访问自己的对话
            Optional<Conversation> conversationOpt = conversationRepo.findByIdAndUser(conversationId, user);
            System.out.println("DEBUG: Conversation found: " + conversationOpt.isPresent());
            
            if (conversationOpt.isEmpty()) {
                System.out.println("DEBUG: Conversation not found");
                return ResponseEntity.status(404).body(Map.of(
                    "code", 404,
                    "error", "对话不存在",
                    "message", "对话不存在或已被删除"
                ));
            }
            
            Conversation c = conversationOpt.get();
            System.out.println("DEBUG: Conversation title: " + c.getTitle());
            
            // 查询消息列表
            System.out.println("DEBUG: Querying messages for conversation: " + conversationId + ", page: " + page + ", limit: " + limit);
            
            // 使用分页方式获取所有消息
            Pageable pageable = PageRequest.of(0, 1000);
            Page<Message> messagePage = messageRepo.findByConversationOrderByCreatedAtDesc(c, pageable);
            List<Message> messages = messagePage.getContent();
            System.out.println("DEBUG: Messages found: " + messages.size());
            
            List<Map<String,Object>> msgs = new ArrayList<>();
            for (Message m : messages) {
                Map<String,Object> mm = new HashMap<>();
                mm.put("id", m.getId());
                mm.put("conversationId", c.getId());
                mm.put("role", m.getRole()); // 添加role字段，前端需要
                mm.put("senderId", m.getRole().equals("user") ? userId : "assistant");
                mm.put("content", m.getContent() != null ? m.getContent() : ""); // 确保content不为null
                mm.put("type", "text");
                mm.put("status", m.getStatus() != null ? m.getStatus() : "sent"); // 确保status不为null
                mm.put("createdAt", toStr(m.getCreatedAt()));
                msgs.add(mm);
            }
            
            // 反转消息顺序，使最新消息在底部
            Collections.reverse(msgs);
            
            // 手动处理分页
            int startIndex = Math.max(0, (page - 1) * limit);
            int endIndex = Math.min(msgs.size(), startIndex + limit);
            List<Map<String,Object>> paginatedMessages = msgs.subList(startIndex, endIndex);
            
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            res.put("data", Map.of(
                "messages", paginatedMessages, 
                "pagination", Map.of(
                    "page", page, 
                    "limit", limit, 
                    "total", msgs.size(), 
                    "hasMore", endIndex < msgs.size()
                )
            ));
            
            System.out.println("DEBUG: Response prepared successfully");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("ERROR in MessageController.list: ");
            e.printStackTrace(System.err);
            System.out.println("ERROR message: " + e.getMessage());
            System.out.println("ERROR class: " + e.getClass().getName());
            
            // 返回更详细的错误信息
            return ResponseEntity.status(500).body(Map.of(
                "code", 500,
                "error", "服务器内部错误",
                "message", e.getMessage(),
                "timestamp", Instant.now().toString()
            ));
        }
    }

    @PostMapping("/read")
    public ResponseEntity<?> markRead(@RequestBody Map<String,Object> body) {
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("success", true);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication auth) {
        if (auth == null || auth.getDetails() == null) {
            return ResponseEntity.status(401).body(Map.of(
                "code", 401,
                "error", "未认证",
                "message", "请先登录"
            ));
        }
        
        String userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
        String username = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("username"), null);
        
        // 尝试通过用户名查找用户
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            // 如果通过用户名找不到，尝试通过userId查找
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("unreadCount", 0);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{conversationId}/search")
    public ResponseEntity<?> search(@PathVariable String conversationId, @RequestParam String query) {
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("messages", List.of());
        return ResponseEntity.ok(res);
    }

    private static String toStr(Instant t) { return t == null ? null : t.toString(); }
    private static Map<String,Object> err(String msg){ 
        Map<String,Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }

    /**
     * 记录用户操作日志
     */
    @PostMapping("/{messageId}/action")
    public ResponseEntity<?> logAction(@PathVariable String messageId, 
                                      @RequestBody Map<String, Object> body,
                                      Authentication auth) {
        try {
            // 检查认证状态
            if (auth == null || auth.getDetails() == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "code", 401,
                    "error", "未认证",
                    "message", "请先登录"
                ));
            }
            
            String userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
            String username = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("username"), null);
            
            // 查找用户
            User user = userRepo.findByUsername(username).orElse(null);
            if (user == null) {
                user = userRepo.findById(userId).orElse(null);
            }
            
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of(
                    "code", 404,
                    "error", "用户不存在",
                    "message", "用户不存在或已被删除"
                ));
            }
            
            // 获取操作参数
            String action = Optional.ofNullable(body.get("action")).map(Object::toString).orElse(null);
            String conversationId = Optional.ofNullable(body.get("conversationId")).map(Object::toString).orElse(null);
            String details = Optional.ofNullable(body.get("details")).map(Object::toString).orElse(null);
            
            if (action == null || action.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "code", 400,
                    "error", "操作类型不能为空",
                    "message", "请提供有效的操作类型"
                ));
            }
            
            // 创建操作记录
            com.example.webui.common.entity.UserActionLog actionLog = new com.example.webui.common.entity.UserActionLog();
            actionLog.setUser(user);
            actionLog.setAction(action);
            actionLog.setMessageId(messageId);
            actionLog.setConversationId(conversationId);
            actionLog.setDetails(details);
            
            // 保存操作记录
            userActionLogRepo.save(actionLog);
            
            return ResponseEntity.ok(Map.of(
                "code", 200,
                "message", "操作记录保存成功",
                "data", Map.of(
                    "id", actionLog.getId(),
                    "action", actionLog.getAction(),
                    "messageId", actionLog.getMessageId(),
                    "conversationId", actionLog.getConversationId(),
                    "createdAt", toStr(actionLog.getCreatedAt())
                )
            ));
            
        } catch (Exception e) {
            System.err.println("记录操作日志失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "code", 500,
                "error", "服务器内部错误",
                "message", "操作记录保存失败"
            ));
        }
    }
}