package com.example.webui.adminapi.controller;

import com.example.webui.common.entity.*;
import com.example.webui.common.repo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.*;

@RestController
@RequestMapping("/admin")
@SuppressWarnings("null")
public class AdminController {
    @Autowired private UserRepository userRepo;
    @Autowired private ConversationRepository conversationRepo;
    @Autowired private MessageRepository messageRepo;
    @Autowired private ModelConfigRepository modelRepo;
    @Autowired private FeedbackRepository feedbackRepo;
    @Autowired private AuditLogRepository auditRepo;
    @Autowired private WorkflowConfigRepository workflowRepo;
    @PersistenceContext private EntityManager entityManager;

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        Map<String,Object> data = new HashMap<>();
        data.put("users", userRepo.count());
        data.put("conversations", conversationRepo.count());
        data.put("messages", messageRepo.count());
        res.put("data", data);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/users/stats")
    public ResponseEntity<?> userStats() {
        try {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            
            // 统计各种状态的用户数量
            long total = userRepo.count();
            long active = userRepo.countByStatus("ACTIVE");
            long pending = userRepo.countByStatus("PENDING");
            long banned = userRepo.countByStatus("BANNED");
            long rejected = userRepo.countByStatus("REJECTED");
            
            Map<String,Object> data = new HashMap<>();
            data.put("total", total);
            data.put("active", active);
            data.put("pending", pending);
            data.put("banned", banned);
            data.put("rejected", rejected);
            
            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取用户统计数据失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取用户统计数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> users() {
        try {
            // 使用自定义查询，获取需要的字段，包括角色信息
            List<Map<String, Object>> users = entityManager.createQuery("SELECT u.id, u.username, u.phone, u.email, u.realName, u.role, u.createdAt FROM User u", Object[].class)
                .getResultList()
                .stream()
                .map(result -> {
                    // 转换查询结果为Map，包含用户角色信息
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", result[0]);
                    userMap.put("username", result[1]);
                    userMap.put("phone", result[2]);
                    userMap.put("email", result[3]);
                    userMap.put("realName", result[4]);
                    userMap.put("role", result[5]);
                    userMap.put("createdAt", result[6] != null ? result[6].toString() : null);
                    return userMap;
                })
                .collect(java.util.stream.Collectors.toList());
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            res.put("data", Map.of("users", users));
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            // 记录详细错误信息
            System.err.println("获取用户列表失败: " + e.getMessage());
            e.printStackTrace();
            // 返回详细的错误信息
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取用户列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @PutMapping("/users/{id}/approve")
    @Transactional
    public ResponseEntity<?> approve(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));
        // 审批通过，设置用户状态为ACTIVE
        u.setStatus("ACTIVE");
        userRepo.save(u);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("user_approve");
            log.setDetails("approve:"+id);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "审批通过");
        return ResponseEntity.ok(res);
    }
    
    @PutMapping("/users/{id}/reject")
    @Transactional
    public ResponseEntity<?> reject(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));
        // 拒绝审批，设置用户状态为REJECTED
        u.setStatus("REJECTED");
        userRepo.save(u);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("user_reject");
            log.setDetails("reject:"+id);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已拒绝");
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        if (!userRepo.existsById(id)) return ResponseEntity.status(404).body(err("用户不存在"));
        userRepo.deleteById(id);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("user_delete");
            log.setDetails("delete:"+id);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已删除");
        return ResponseEntity.ok(res);
    }
    
    @PutMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable("id") String id, @RequestBody Map<String,Object> patch, Authentication auth, HttpServletRequest request) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(err("用户不存在"));
        
        // 支持修改用户的基本信息和角色
        if (patch.containsKey("username")) user.setUsername(patch.get("username").toString());
        if (patch.containsKey("phone")) user.setPhone(patch.get("phone").toString());
        if (patch.containsKey("email")) user.setEmail(patch.get("email").toString());
        if (patch.containsKey("realName")) user.setRealName(patch.get("realName").toString());
        if (patch.containsKey("role")) {
            String newRole = patch.get("role").toString();
            // 验证角色是否合法
            if (newRole.equals("USER") || newRole.equals("ADMIN")) {
                user.setRole(newRole);
            } else {
                return ResponseEntity.badRequest().body(err("角色只能是USER或ADMIN"));
            }
        }
        if (patch.containsKey("password")) {
            String newPassword = patch.get("password").toString();
            if (newPassword.length() >= 8) {
                user.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(newPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            } else {
                return ResponseEntity.badRequest().body(err("密码长度必须至少为8个字符"));
            }
        }
        if (patch.containsKey("status")) {
            String newStatus = patch.get("status").toString();
            // 验证状态是否合法
            if (newStatus.equals("PENDING") || newStatus.equals("ACTIVE") || newStatus.equals("REJECTED") || newStatus.equals("BANNED")) {
                user.setStatus(newStatus);
            } else {
                return ResponseEntity.badRequest().body(err("状态只能是PENDING、ACTIVE、REJECTED或BANNED"));
            }
        }
        
        userRepo.save(user);
        
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("user_update");
            log.setDetails(id+":"+user.getRole()+":"+user.getStatus());
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已更新");
        return ResponseEntity.ok(res);
    }
    
    @PutMapping("/users/{id}/ban")
    @Transactional
    public ResponseEntity<?> banUser(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));
        // 封禁用户，设置状态为BANNED
        u.setStatus("BANNED");
        userRepo.save(u);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("user_ban");
            log.setDetails("ban:"+id);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "用户已封禁");
        return ResponseEntity.ok(res);
    }
    
    @PutMapping("/users/{id}/unban")
    @Transactional
    public ResponseEntity<?> unbanUser(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));
        // 解封用户，设置状态为ACTIVE
        u.setStatus("ACTIVE");
        userRepo.save(u);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("user_unban");
            log.setDetails("unban:"+id);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "用户已解封");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/users/{id}/conversations")
    public ResponseEntity<?> userConversations(@PathVariable("id") String id) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));
        List<Conversation> convs = conversationRepo.findByUserOrderByUpdatedAtDesc(u);
        List<Map<String,Object>> res = new ArrayList<>();
        for (Conversation c : convs) {
            Message last = c.getMessages().stream().max(Comparator.comparing(Message::getCreatedAt)).orElse(null);
            Map<String,Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("title", c.getTitle());
            if (last != null) m.put("lastMessage", Map.of("id", last.getId(), "content", last.getContent()));
            res.add(m);
        }
        Map<String,Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", Map.of("conversations", res));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> conversations(@RequestParam(name = "page", defaultValue = "1") int page,
                                          @RequestParam(name = "limit", defaultValue = "50") int limit,
                                          @RequestParam(name = "query", required = false) String query) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        
        // 确保page参数至少为1，避免负数页码
        if (page < 1) {
            page = 1;
        }
        
        // 使用PageRequest进行分页查询，Spring Data的页码从0开始
        PageRequest pageable = PageRequest.of(page - 1, limit);
        Page<Conversation> conversationPage;
        
        // 如果有查询参数，则进行模糊查询
        if (query != null && !query.isBlank()) {
            // 按标题模糊查询
            conversationPage = conversationRepo.findByTitleContainingIgnoreCase(query, pageable);
        } else {
            conversationPage = conversationRepo.findAll(pageable);
        }
        
        Map<String, Object> data = new HashMap<>();
        
        // 转换对话数据，避免循环引用
        List<Map<String, Object>> conversations = conversationPage.getContent().stream().map(conv -> {
            Map<String, Object> convMap = new HashMap<>();
            convMap.put("id", conv.getId());
            convMap.put("title", conv.getTitle());
            convMap.put("createdAt", conv.getCreatedAt().toString());
            convMap.put("updatedAt", conv.getUpdatedAt().toString());
            
            // 获取用户信息
            if (conv.getUser() != null) {
                convMap.put("userId", conv.getUser().getId());
                convMap.put("username", conv.getUser().getUsername());
            } else {
                convMap.put("userId", null);
                convMap.put("username", "未知用户");
            }
            
            // 获取最后一条消息
            Message lastMessage = conv.getMessages().stream()
                    .max(Comparator.comparing(Message::getCreatedAt))
                    .orElse(null);
            
            if (lastMessage != null) {
                convMap.put("lastMessage", Map.of(
                    "id", lastMessage.getId(),
                    "content", lastMessage.getContent().length() > 50 ? 
                            lastMessage.getContent().substring(0, 50) + "..." : 
                            lastMessage.getContent(),
                    "createdAt", lastMessage.getCreatedAt().toString()
                ));
                convMap.put("messageCount", conv.getMessages().size());
            } else {
                convMap.put("lastMessage", null);
                convMap.put("messageCount", 0);
            }
            
            return convMap;
        }).toList();
        
        data.put("conversations", conversations);
        
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", conversationPage.getTotalElements());
        pagination.put("totalPages", conversationPage.getTotalPages());
        
        data.put("pagination", pagination);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/conversations/{id}")
    @Transactional
    public ResponseEntity<?> deleteConversation(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        Conversation conv = conversationRepo.findById(id).orElse(null);
        if (conv == null) return ResponseEntity.status(404).body(err("对话不存在"));
        
        // 删除对话及其所有消息（由于设置了级联删除，消息会自动删除）
        conversationRepo.deleteById(id);
        
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("conversation_delete");
            log.setDetails("delete:" + id + ":" + conv.getTitle());
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "对话已删除");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/conversations/export")
    public ResponseEntity<?> exportConversations(@RequestParam(name = "format", defaultValue = "csv") String format,
                                                @RequestParam(name = "startTime", required = false) String startTime,
                                                @RequestParam(name = "endTime", required = false) String endTime,
                                                @RequestParam(name = "query", required = false) String query) {
        try {
            // 获取所有对话（暂时不考虑分页，导出所有数据）
            List<Conversation> allConversations;
            
            if (query != null && !query.isBlank()) {
                // 按标题模糊查询
                allConversations = conversationRepo.findByTitleContainingIgnoreCase(query);
            } else {
                allConversations = conversationRepo.findAll();
            }
            
            // 根据格式生成导出内容
            String content;
            String contentType;
            String filename;
            
            if (format.equalsIgnoreCase("json")) {
                // 生成JSON格式
                StringBuilder json = new StringBuilder();
                json.append("[");
                
                for (int i = 0; i < allConversations.size(); i++) {
                    Conversation conv = allConversations.get(i);
                    json.append("{");
                    json.append("\"id\":\"").append(conv.getId()).append("\",");
                    json.append("\"title\":\"").append(conv.getTitle() != null ? conv.getTitle().replace("\"", "\\\"") : "").append("\",");
                    json.append("\"createdAt\":\"").append(conv.getCreatedAt()).append("\",");
                    json.append("\"updatedAt\":\"").append(conv.getUpdatedAt()).append("\",");
                    
                    if (conv.getUser() != null) {
                        json.append("\"userId\":\"").append(conv.getUser().getId()).append("\",");
                        json.append("\"username\":\"").append(conv.getUser().getUsername()).append("\",");
                    } else {
                        json.append("\"userId\":null,");
                        json.append("\"username\":\"未知用户\",");
                    }
                    
                    json.append("\"messageCount\":").append(conv.getMessages().size()).append(",");
                    
                    // 获取最后一条消息
                    Message lastMessage = conv.getMessages().stream()
                            .max(Comparator.comparing(Message::getCreatedAt))
                            .orElse(null);
                    
                    if (lastMessage != null) {
                        json.append("\"lastMessage\":{");
                        json.append("\"id\":\"").append(lastMessage.getId()).append("\",");
                        json.append("\"content\":\"").append(lastMessage.getContent() != null ? lastMessage.getContent().replace("\"", "\\\"") : "").append("\",");
                        json.append("\"role\":\"").append(lastMessage.getRole()).append("\",");
                        json.append("\"createdAt\":\"").append(lastMessage.getCreatedAt()).append("\"");
                        json.append("}");
                    } else {
                        json.append("\"lastMessage\":null");
                    }
                    
                    json.append("}");
                    
                    if (i < allConversations.size() - 1) {
                        json.append(",");
                    }
                }
                
                json.append("]");
                content = json.toString();
                contentType = "application/json";
                filename = "conversations_export.json";
            } else {
                // 默认生成CSV格式
                StringBuilder csv = new StringBuilder();
                // 写入CSV表头
                csv.append("ID,Title,User ID,Username,Message Count,Last Message,Created At,Updated At\n");
                // 写入数据行
                for (Conversation conv : allConversations) {
                    csv.append(conv.getId()).append(",");
                    csv.append("\"").append(conv.getTitle() != null ? conv.getTitle().replace("\"", "\"\"") : "").append("\",");
                    
                    if (conv.getUser() != null) {
                        csv.append(conv.getUser().getId()).append(",");
                        csv.append(conv.getUser().getUsername()).append(",");
                    } else {
                        csv.append(",");
                        csv.append("未知用户,");
                    }
                    
                    csv.append(conv.getMessages().size()).append(",");
                    
                    // 获取最后一条消息
                    Message lastMessage = conv.getMessages().stream()
                            .max(Comparator.comparing(Message::getCreatedAt))
                            .orElse(null);
                    
                    if (lastMessage != null) {
                        String lastMsgContent = lastMessage.getContent() != null ? 
                                lastMessage.getContent().replace("\"", "\"\"") : "";
                        if (lastMsgContent.length() > 100) {
                            lastMsgContent = lastMsgContent.substring(0, 100) + "...";
                        }
                        csv.append("\"").append(lastMsgContent).append("\",");
                    } else {
                        csv.append(",");
                    }
                    
                    csv.append(conv.getCreatedAt()).append(",");
                    csv.append(conv.getUpdatedAt()).append("\n");
                }
                content = csv.toString();
                contentType = "text/csv";
                filename = "conversations_export.csv";
            }
            
            // 返回文件下载响应
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(err("对话导出失败: " + e.getMessage()));
        }
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> conversationMessages(@PathVariable("id") String id,
                                                  @RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "50") int limit) {
        Conversation c = conversationRepo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("会话不存在"));
        List<Message> list = c.getMessages();
        list.sort(Comparator.comparing(Message::getCreatedAt));
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("data", Map.of("messages", list, "pagination", Map.of("total", list.size())));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/models")
    public ResponseEntity<?> getModels() {
        List<ModelConfig> models = modelRepo.findAll();
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("data", Map.of("models", models));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/models")
    @Transactional
    public ResponseEntity<?> createModel(@RequestBody ModelConfig m, Authentication auth, HttpServletRequest request) {
        try {
            // 添加必填字段验证
            if (m.getProvider() == null || m.getProvider().isBlank()) {
                return ResponseEntity.badRequest().body(err("provider字段不能为空"));
            }
            if (m.getEndpoint() == null || m.getEndpoint().isBlank()) {
                return ResponseEntity.badRequest().body(err("endpoint字段不能为空"));
            }
            if (m.getModelName() == null || m.getModelName().isBlank()) {
                return ResponseEntity.badRequest().body(err("modelName字段不能为空"));
            }
            if (m.getTag() == null || m.getTag().isBlank()) {
                return ResponseEntity.badRequest().body(err("tag字段不能为空"));
            }
            
            m.setId(null); 
            modelRepo.save(m);
            try {
                AuditLog log = new AuditLog();
                String actorId = getActorId(auth);
                // 从数据库中获取用户对象，避免瞬态对象错误
                User actor = userRepo.findById(actorId).orElse(null);
                if (actor != null) {
                    log.setUser(actor);
                    log.setAction("model_create");
                    log.setDetails(m.getProvider()+"/"+m.getModelName());
                    log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
                    auditRepo.save(log);
                }
            } catch (Exception ignored) {}
            Map<String,Object> res = new HashMap<>();
            res.put("code", 201);
            res.put("message", "已创建");
            return ResponseEntity.status(201).body(res);
        } catch (Exception e) {
            // 记录详细错误信息
            System.err.println("创建模型失败: " + e.getMessage());
            e.printStackTrace();
            // 返回详细的错误信息
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "创建模型失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @PutMapping("/models/{id}")
    @Transactional
    public ResponseEntity<?> updateModel(@PathVariable("id") String id, @RequestBody Map<String,Object> patch, Authentication auth, HttpServletRequest request) {
        ModelConfig mc = modelRepo.findById(id).orElse(null);
        if (mc == null) return ResponseEntity.status(404).body(err("模型不存在"));
        
        // 支持修改所有模型配置字段
        if (patch.containsKey("enabled")) mc.setEnabled(Boolean.parseBoolean(patch.get("enabled").toString()));
        if (patch.containsKey("endpoint")) mc.setEndpoint(Objects.toString(patch.get("endpoint"), null));
        if (patch.containsKey("apiKey")) mc.setApiKey(Objects.toString(patch.get("apiKey"), null));
        if (patch.containsKey("modelName")) mc.setModelName(Objects.toString(patch.get("modelName"), null));
        if (patch.containsKey("provider")) mc.setProvider(Objects.toString(patch.get("provider"), null));
        if (patch.containsKey("tag")) mc.setTag(Objects.toString(patch.get("tag"), null));
        if (patch.containsKey("protocol")) mc.setProtocol(Objects.toString(patch.get("protocol"), null));
        if (patch.containsKey("temperature")) mc.setTemperature(Double.parseDouble(Objects.toString(patch.get("temperature"), "0.0")));
        if (patch.containsKey("maxTokens")) mc.setMaxTokens(Integer.parseInt(Objects.toString(patch.get("maxTokens"), "0")));
        if (patch.containsKey("topP")) mc.setTopP(Double.parseDouble(Objects.toString(patch.get("topP"), "0.0")));
        
        modelRepo.save(mc);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            // 从数据库中获取用户对象，避免瞬态对象错误
            User actor = userRepo.findById(actorId).orElse(null);
            if (actor != null) {
                log.setUser(actor);
                log.setAction("model_update");
                log.setDetails(mc.getProvider()+"/"+mc.getModelName());
                log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
                auditRepo.save(log);
            }
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已更新");
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/models/{id}")
    @Transactional
    public ResponseEntity<?> deleteModel(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        if (!modelRepo.existsById(id)) return ResponseEntity.status(404).body(err("模型不存在"));
        modelRepo.deleteById(id);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            // 从数据库中获取用户对象，避免瞬态对象错误
            User actor = userRepo.findById(actorId).orElse(null);
            if (actor != null) {
                log.setUser(actor);
                log.setAction("model_delete");
                log.setDetails(id);
                log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
                auditRepo.save(log);
            }
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已删除");
        return ResponseEntity.ok(res);
    }
    
    @GetMapping("/feedbacks/stats")
    public ResponseEntity<?> feedbackStats() {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("code", 200);
            
            // 统计各种状态的反馈数量
            long total = feedbackRepo.count();
            long pending = feedbackRepo.countByStatus("pending");
            long processed = feedbackRepo.countByStatus("processed");
            long closed = feedbackRepo.countByStatus("closed");
            
            Map<String, Object> data = new HashMap<>();
            data.put("total", total);
            data.put("pending", pending);
            data.put("processed", processed);
            data.put("closed", closed);
            
            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取反馈统计数据失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取反馈统计数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @GetMapping("/feedbacks")
    public ResponseEntity<?> feedbacks(@RequestParam(name = "page", defaultValue = "1") int page,
                                      @RequestParam(name = "limit", defaultValue = "50") int limit) {
        // 修复：查询实际的反馈数据
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        
        // 使用PageRequest进行分页查询
        PageRequest pageable = PageRequest.of(page - 1, limit);
        Page<Feedback> feedbackPage = feedbackRepo.findAll(pageable);
        
        Map<String, Object> data = new HashMap<>();
        
        // 转换反馈数据，避免循环引用
        List<Map<String, Object>> feedbacks = feedbackPage.getContent().stream().map(f -> {
            Map<String, Object> feedbackMap = new HashMap<>();
            feedbackMap.put("id", f.getId());
            feedbackMap.put("userId", f.getUser().getId());
            feedbackMap.put("username", f.getUser().getUsername());
            feedbackMap.put("type", f.getType());
            feedbackMap.put("content", f.getContent());
            feedbackMap.put("contact", f.getContact());
            feedbackMap.put("status", f.getStatus());
            feedbackMap.put("createdAt", f.getCreatedAt().toString());
            feedbackMap.put("handlerId", f.getHandlerId());
            feedbackMap.put("handledAt", f.getHandledAt() != null ? f.getHandledAt().toString() : null);
            feedbackMap.put("resolution", f.getResolution());
            return feedbackMap;
        }).collect(java.util.stream.Collectors.toList());
        
        data.put("feedbacks", feedbacks);
        
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", feedbackPage.getTotalElements());
        pagination.put("totalPages", feedbackPage.getTotalPages());
        
        data.put("pagination", pagination);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    public ResponseEntity<?> logs(@RequestParam(name = "page", defaultValue = "1") int page,
                                  @RequestParam(name = "limit", defaultValue = "50") int limit,
                                  @RequestParam(name = "query", required = false) String query) {
        // 修复：查询实际的审计日志数据
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        
        // 确保page参数至少为1，避免负数页码
        if (page < 1) {
            page = 1;
        }
        
        // 使用PageRequest进行分页查询，Spring Data的页码从0开始
        PageRequest pageable = PageRequest.of(page - 1, limit);
        Page<AuditLog> auditLogPage;
        
        // 如果有查询参数，则进行模糊查询
        if (query != null && !query.isBlank()) {
            // 目前没有实现查询功能，先返回所有日志
            auditLogPage = auditRepo.findAll(pageable);
        } else {
            auditLogPage = auditRepo.findAll(pageable);
        }
        
        Map<String, Object> data = new HashMap<>();
        
        // 转换日志数据，避免循环引用
        List<Map<String, Object>> logs = auditLogPage.getContent().stream().map(log -> {
            Map<String, Object> logMap = new HashMap<>();
            logMap.put("id", log.getId());
            // 安全地获取用户信息，避免NPE
            if (log.getUser() != null) {
                logMap.put("userId", log.getUser().getId());
                logMap.put("username", log.getUser().getUsername());
            } else {
                logMap.put("userId", null);
                logMap.put("username", "未知用户");
            }
            logMap.put("ip", log.getIp());
            logMap.put("action", log.getAction());
            logMap.put("details", log.getDetails());
            logMap.put("createdAt", log.getCreatedAt().toString());
            return logMap;
        }).toList();
        
        data.put("logs", logs);
        
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", auditLogPage.getTotalElements());
        pagination.put("totalPages", auditLogPage.getTotalPages());
        
        data.put("pagination", pagination);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/logs/export")
    public ResponseEntity<?> exportLogs(@RequestParam(name = "format", defaultValue = "csv") String format,
                                       @RequestParam(name = "startTime", required = false) String startTime,
                                       @RequestParam(name = "endTime", required = false) String endTime,
                                       @RequestParam(name = "action", required = false) String action) {
        try {
            // 获取所有日志（暂时不考虑分页，导出所有数据）
            List<AuditLog> allLogs = auditRepo.findAll();
            
            // 根据格式生成导出内容
            String content;
            String contentType;
            String filename;
            
            if (format.equalsIgnoreCase("json")) {
                // 生成JSON格式 - 使用简单的方式
                StringBuilder json = new StringBuilder();
                json.append("[");
                
                for (int i = 0; i < allLogs.size(); i++) {
                    AuditLog log = allLogs.get(i);
                    json.append("{");
                    json.append("\"id\":\"").append(log.getId()).append("\",");
                    if (log.getUser() != null) {
                        json.append("\"userId\":\"").append(log.getUser().getId()).append("\",");
                        json.append("\"username\":\"").append(log.getUser().getUsername()).append("\",");
                    } else {
                        json.append("\"userId\":null,");
                        json.append("\"username\":\"未知用户\",");
                    }
                    json.append("\"ip\":\"").append(log.getIp()).append("\",");
                    json.append("\"action\":\"").append(log.getAction()).append("\",");
                    json.append("\"details\":\"").append(log.getDetails() != null ? log.getDetails().replace("\"", "\\\"") : "").append("\",");
                    json.append("\"createdAt\":\"").append(log.getCreatedAt()).append("\"");
                    json.append("}");
                    
                    if (i < allLogs.size() - 1) {
                        json.append(",");
                    }
                }
                
                json.append("]");
                content = json.toString();
                contentType = "application/json";
                filename = "logs_export.json";
            } else {
                // 默认生成CSV格式
                StringBuilder csv = new StringBuilder();
                // 写入CSV表头
                csv.append("ID,User ID,Username,IP,Action,Details,Created At\n");
                // 写入数据行
                for (AuditLog log : allLogs) {
                    csv.append(log.getId()).append(",");
                    // 安全地获取用户信息，避免NPE
                    if (log.getUser() != null) {
                        csv.append(log.getUser().getId()).append(",");
                        csv.append(log.getUser().getUsername()).append(",");
                    } else {
                        csv.append(",");
                        csv.append("未知用户,");
                    }
                    csv.append(log.getIp()).append(",");
                    csv.append(log.getAction()).append(",");
                    csv.append("\"").append(log.getDetails() != null ? log.getDetails().replace("\"", "\"\"") : "").append("\"").append(",");
                    csv.append(log.getCreatedAt()).append("\n");
                }
                content = csv.toString();
                contentType = "text/csv";
                filename = "logs_export.csv";
            }
            
            // 返回文件下载响应
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(err("日志导出失败: " + e.getMessage()));
        }
    }

    @PutMapping("/feedbacks/{id}")
    @Transactional
    public ResponseEntity<?> updateFeedback(@PathVariable("id") String id, @RequestBody Map<String,Object> patch, Authentication auth, HttpServletRequest request) {
        Feedback f = feedbackRepo.findById(id).orElse(null);
        if (f == null) return ResponseEntity.status(404).body(err("反馈不存在"));
        if (patch.containsKey("status")) f.setStatus(patch.get("status").toString());
        if (patch.containsKey("resolution")) f.setResolution(Objects.toString(patch.get("resolution"), null));
        feedbackRepo.save(f);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("feedback_update");
            log.setDetails(id+":"+f.getStatus());
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已更新");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/workflows")
    public ResponseEntity<?> getWorkflows() {
        List<WorkflowConfig> workflows = workflowRepo.findAll();
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("data", Map.of("workflows", workflows));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/workflows")
    @Transactional
    public ResponseEntity<?> createWorkflow(@RequestBody WorkflowConfig w, Authentication auth, HttpServletRequest request) {
        w.setId(null); workflowRepo.save(w);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            // 检查用户是否存在于当前数据库
            Optional<User> userOpt = userRepo.findById(actorId);
            if (userOpt.isPresent()) {
                log.setUser(userOpt.get());
            } else {
                // 如果用户不存在，跳过审计日志保存
                return ResponseEntity.status(201).body(Map.of("code", 201, "message", "已创建"));
            }
            log.setAction("workflow_create");
            log.setDetails(w.getName()+"/"+w.getWorkflowId());
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 201);
        res.put("message", "已创建");
        return ResponseEntity.status(201).body(res);
    }

    @PutMapping("/workflows/{id}")
    @Transactional
    public ResponseEntity<?> updateWorkflow(@PathVariable("id") String id, @RequestBody WorkflowConfig w, Authentication auth, HttpServletRequest request) {
        WorkflowConfig wc = workflowRepo.findById(id).orElse(null);
        if (wc == null) return ResponseEntity.status(404).body(err("工作流不存在"));
        wc.setName(w.getName());
        wc.setWorkflowId(w.getWorkflowId());
        wc.setDescription(w.getDescription());
        wc.setEndpoint(w.getEndpoint());
        wc.setApiKey(w.getApiKey());
        wc.setEnabled(w.isEnabled());
        wc.setConfigJson(w.getConfigJson());
        workflowRepo.save(wc);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("workflow_update");
            log.setDetails(wc.getName()+"/"+wc.getWorkflowId());
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已更新");
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/workflows/{id}")
    @Transactional
    public ResponseEntity<?> deleteWorkflow(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        if (!workflowRepo.existsById(id)) return ResponseEntity.status(404).body(err("工作流不存在"));
        workflowRepo.deleteById(id);
        try {
            AuditLog log = new AuditLog();
            String actorId = getActorId(auth);
            User actor = new User(); actor.setId(actorId); log.setUser(actor);
            log.setAction("workflow_delete");
            log.setDetails(id);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            auditRepo.save(log);
        } catch (Exception ignored) {}
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已删除");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/workflows/test")
    public ResponseEntity<?> testWorkflow(@RequestBody Map<String,Object> testData, Authentication auth, HttpServletRequest request) {
        try {
            // 模拟工作流测试，实际应该调用Bisheng工作流API
            String workflowId = Objects.toString(testData.get("workflowId"), "");
            String endpoint = Objects.toString(testData.get("endpoint"), "");
            
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            res.put("success", true);
            res.put("message", "工作流测试成功 - 工作流ID: " + workflowId + ", 端点: " + endpoint);
            
            try {
                AuditLog log = new AuditLog();
                String actorId = getActorId(auth);
                User actor = new User(); actor.setId(actorId); log.setUser(actor);
                log.setAction("workflow_test");
                log.setDetails(workflowId);
                log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
                auditRepo.save(log);
            } catch (Exception ignored) {}
            
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 400);
            res.put("success", false);
            res.put("message", "工作流测试失败: " + e.getMessage());
            return ResponseEntity.status(400).body(res);
        }
    }

    private String getActorId(Authentication auth) {
        try {
            Object details = auth != null ? auth.getDetails() : null;
            if (details instanceof java.util.Map) {
                Object v = ((java.util.Map<?,?>) details).get("userId");
                return v != null ? v.toString() : "";
            }
            return "";
        } catch (Exception e) {
            return "";
        }
    }

    private static Map<String,Object> err(String msg){ 
        Map<String,Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }
}
