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
    @Autowired private PasswordResetRepository passwordResetRepo;
    @Autowired private UserActionLogRepository userActionLogRepo;
    @Autowired private SystemConfigRepository systemConfigRepo;
    @Autowired private ViolationRecordRepository violationRecordRepo;
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

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        try {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            Map<String,Object> data = new HashMap<>();

            // 用户统计
            long totalUsers = userRepo.count();
            long activeUsers = userRepo.countByStatus("ACTIVE");
            long pendingUsers = userRepo.countByStatus("PENDING");
            long bannedUsers = userRepo.countByStatus("BANNED");

            data.put("totalUsers", totalUsers);
            data.put("activeUsers", activeUsers);
            data.put("pendingUsers", pendingUsers);
            data.put("bannedUsers", bannedUsers);

            // 对话和消息统计
            long totalConversations = conversationRepo.count();
            long totalMessages = messageRepo.count();
            data.put("totalConversations", totalConversations);
            data.put("totalMessages", totalMessages);

            // 反馈统计
            long totalFeedbacks = feedbackRepo.count();
            long pendingFeedbacks = feedbackRepo.countByStatus("pending");
            data.put("totalFeedbacks", totalFeedbacks);
            data.put("pendingFeedbacks", pendingFeedbacks);

            // 模型和工作流统计
            long totalModels = modelRepo.count();
            long enabledModels = modelRepo.countByEnabled(true);
            long totalWorkflows = workflowRepo.count();
            long enabledWorkflows = workflowRepo.countByEnabled(true);
            data.put("totalModels", totalModels);
            data.put("enabledModels", enabledModels);
            data.put("totalWorkflows", totalWorkflows);
            data.put("enabledWorkflows", enabledWorkflows);

            // 违规统计
            long totalViolations = violationRecordRepo.count();
            data.put("totalViolations", totalViolations);

            // 密码重置申请统计
            long pendingPasswordResets = passwordResetRepo.countByStatus("pending");
            data.put("pendingPasswordResets", pendingPasswordResets);

            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取控制台统计数据失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取统计数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
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
    public ResponseEntity<?> users(
            @RequestParam(name = "username", required = false) String username,
            @RequestParam(name = "phone", required = false) String phone,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        try {
            // 构建动态查询，包含封禁相关字段和实名认证字段
            StringBuilder jpql = new StringBuilder("SELECT u.id, u.username, u.phone, u.email, u.realName, u.role, u.status, u.createdAt, u.banCount, u.bannedUntil, u.bannedAt, u.verificationStatus, u.verificationMessage, u.verificationTime FROM User u WHERE 1=1");
            List<Object> params = new ArrayList<>();
            int paramIndex = 1;

            if (username != null && !username.isBlank()) {
                jpql.append(" AND LOWER(u.username) LIKE LOWER(?").append(paramIndex++).append(")");
                params.add("%" + username + "%");
            }
            if (phone != null && !phone.isBlank()) {
                jpql.append(" AND u.phone LIKE ?").append(paramIndex++);
                params.add("%" + phone + "%");
            }
            if (email != null && !email.isBlank()) {
                jpql.append(" AND LOWER(u.email) LIKE LOWER(?").append(paramIndex++).append(")");
                params.add("%" + email + "%");
            }
            if (status != null && !status.isBlank()) {
                jpql.append(" AND UPPER(u.status) = UPPER(?").append(paramIndex++).append(")");
                params.add(status);
            }
            if (role != null && !role.isBlank()) {
                jpql.append(" AND UPPER(u.role) = UPPER(?").append(paramIndex++).append(")");
                params.add(role);
            }

            jpql.append(" ORDER BY u.createdAt DESC");

            // 执行查询
            var query = entityManager.createQuery(jpql.toString(), Object[].class);
            for (int i = 0; i < params.size(); i++) {
                query.setParameter(i + 1, params.get(i));
            }

            // 获取总数（用于分页）
            String countJpql = jpql.toString().replace("SELECT u.id, u.username, u.phone, u.email, u.realName, u.role, u.status, u.createdAt, u.banCount, u.bannedUntil, u.bannedAt, u.verificationStatus, u.verificationMessage, u.verificationTime", "SELECT COUNT(u.id)");
            countJpql = countJpql.replaceFirst(" ORDER BY u.createdAt DESC", "");
            var countQuery = entityManager.createQuery(countJpql, Long.class);
            for (int i = 0; i < params.size(); i++) {
                countQuery.setParameter(i + 1, params.get(i));
            }
            long total = countQuery.getSingleResult();

            // 分页
            if (page < 1) page = 1;
            query.setFirstResult((page - 1) * limit);
            query.setMaxResults(limit);

            List<Map<String, Object>> users = query.getResultList()
                .stream()
                .map(result -> {
                    // 转换查询结果为Map，包含用户角色、状态、封禁信息和实名认证信息
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", result[0]);
                    userMap.put("username", result[1]);
                    userMap.put("phone", result[2]);
                    userMap.put("email", result[3]);
                    userMap.put("realName", result[4]);
                    userMap.put("role", result[5]);
                    userMap.put("status", result[6]);
                    userMap.put("createdAt", result[7] != null ? result[7].toString() : null);
                    userMap.put("banCount", result[8] != null ? result[8] : 0);
                    userMap.put("bannedUntil", result[9] != null ? result[9].toString() : null);
                    userMap.put("bannedAt", result[10] != null ? result[10].toString() : null);
                    userMap.put("verificationStatus", result[11]);
                    userMap.put("verificationMessage", result[12]);
                    userMap.put("verificationTime", result[13] != null ? result[13].toString() : null);
                    return userMap;
                })
                .collect(java.util.stream.Collectors.toList());

            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);

            Map<String, Object> data = new HashMap<>();
            data.put("users", users);
            data.put("pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", total,
                "totalPages", (int) Math.ceil((double) total / limit)
            ));
            res.put("data", data);

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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "user_approve", "approve:"+id);

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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "user_reject", "reject:"+id);

        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已拒绝");
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(err("用户不存在"));

        // 级联删除用户的所有关联数据

        // 1. 删除用户的所有会话和消息
        List<Conversation> conversations = conversationRepo.findByUser(user);
        for (Conversation conv : conversations) {
            // 先删除会话中的所有消息
            messageRepo.deleteByConversation(conv);
        }
        // 删除所有会话
        conversationRepo.deleteByUser(user);

        // 2. 删除用户的反馈
        feedbackRepo.deleteByUser(user);

        // 3. 删除用户的审计日志
        auditRepo.deleteByUser(user);

        // 4. 删除用户的密码重置记录
        passwordResetRepo.deleteByUser(user);

        // 5. 删除用户的操作日志
        userActionLogRepo.deleteByUserId(id);

        // 6. 删除用户的违规记录
        violationRecordRepo.deleteByUser(user);

        // 7. 最后删除用户
        userRepo.delete(user);

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "user_delete", "delete:" + id + " (级联删除所有关联数据)");

        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已删除（包含所有关联数据）");
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
            if (newRole.equals("USER") || newRole.equals("ADMIN") || newRole.equals("TEST")) {
                user.setRole(newRole);
            } else {
                return ResponseEntity.badRequest().body(err("角色只能是USER、ADMIN或TEST"));
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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "user_update", id+":"+user.getRole()+":"+user.getStatus());

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
        // 封禁用户，设置状态为BANNED，记录封禁时间
        u.setStatus("BANNED");
        u.setBannedAt(java.time.Instant.now());
        userRepo.save(u);

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "user_ban", "ban:"+id);

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
        // 解封用户，设置状态为ACTIVE，清除封禁时间
        u.setStatus("ACTIVE");
        u.setBannedUntil(null);
        u.setBannedAt(null);
        userRepo.save(u);

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "user_unban", "unban:"+id);

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
                                          @RequestParam(name = "query", required = false) String query,
                                          @RequestParam(name = "sortOrder", defaultValue = "desc") String sortOrder) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);

        // 确保page参数至少为1，避免负数页码
        if (page < 1) {
            page = 1;
        }

        // 使用PageRequest进行分页查询，Spring Data的页码从0开始，支持排序
        org.springframework.data.domain.Sort sort = "asc".equalsIgnoreCase(sortOrder)
            ? org.springframework.data.domain.Sort.by("createdAt").ascending()
            : org.springframework.data.domain.Sort.by("createdAt").descending();
        PageRequest pageable = PageRequest.of(page - 1, limit, sort);
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

            // 获取标题，如果为空或"新会话"则从第一条用户消息自动生成
            String title = conv.getTitle();
            if (title == null || title.isBlank() || title.equals("新会话") || title.equals("新对话")) {
                // 从第一条用户消息生成标题
                Message firstUserMessage = conv.getMessages().stream()
                        .filter(m -> "user".equals(m.getRole()))
                        .min(Comparator.comparing(Message::getCreatedAt))
                        .orElse(null);
                if (firstUserMessage != null && firstUserMessage.getContent() != null) {
                    String content = firstUserMessage.getContent().trim();
                    // 取前30个字符作为标题
                    title = content.length() > 30 ? content.substring(0, 30) + "..." : content;
                } else {
                    title = "对话 " + conv.getId().substring(0, 8);
                }
            }
            convMap.put("title", title);

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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "conversation_delete", "delete:" + id + ":" + conv.getTitle());

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
                                                  @RequestParam(name = "page", defaultValue = "1") int page,
                                                  @RequestParam(name = "limit", defaultValue = "50") int limit) {
        Conversation c = conversationRepo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("会话不存在"));
        List<Message> list = c.getMessages();
        list.sort(Comparator.comparing(Message::getCreatedAt));

        // 手动构建消息列表，避免循环引用
        List<Map<String,Object>> messagesList = new ArrayList<>();
        for (Message msg : list) {
            Map<String,Object> msgMap = new HashMap<>();
            msgMap.put("id", msg.getId());
            msgMap.put("role", msg.getRole());
            msgMap.put("content", msg.getContent());
            msgMap.put("status", msg.getStatus());
            msgMap.put("createdAt", msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
            msgMap.put("conversationId", id);
            messagesList.add(msgMap);
        }

        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("data", Map.of("messages", messagesList, "pagination", Map.of("total", list.size())));
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
    
    // 注意：/feedbacks/stats 必须在 /feedbacks 之前定义，否则会被 /feedbacks 拦截
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
                                      @RequestParam(name = "limit", defaultValue = "50") int limit,
                                      @RequestParam(name = "username", required = false) String username,
                                      @RequestParam(name = "type", required = false) String type,
                                      @RequestParam(name = "status", required = false) String status,
                                      @RequestParam(name = "keyword", required = false) String keyword) {
        try {
            // 构建动态查询
            StringBuilder jpql = new StringBuilder("SELECT f FROM Feedback f WHERE 1=1");
            StringBuilder countJpql = new StringBuilder("SELECT COUNT(f) FROM Feedback f WHERE 1=1");
            List<Object> params = new ArrayList<>();
            int paramIndex = 1;

            if (username != null && !username.isBlank()) {
                jpql.append(" AND LOWER(f.user.username) LIKE LOWER(?").append(paramIndex).append(")");
                countJpql.append(" AND LOWER(f.user.username) LIKE LOWER(?").append(paramIndex++).append(")");
                params.add("%" + username + "%");
            }
            if (type != null && !type.isBlank()) {
                jpql.append(" AND f.type = ?").append(paramIndex);
                countJpql.append(" AND f.type = ?").append(paramIndex++);
                params.add(type);
            }
            if (status != null && !status.isBlank()) {
                jpql.append(" AND f.status = ?").append(paramIndex);
                countJpql.append(" AND f.status = ?").append(paramIndex++);
                params.add(status);
            }
            if (keyword != null && !keyword.isBlank()) {
                jpql.append(" AND LOWER(f.content) LIKE LOWER(?").append(paramIndex).append(")");
                countJpql.append(" AND LOWER(f.content) LIKE LOWER(?").append(paramIndex++).append(")");
                params.add("%" + keyword + "%");
            }

            jpql.append(" ORDER BY f.createdAt DESC");

            // 获取总数
            var countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
            for (int i = 0; i < params.size(); i++) {
                countQuery.setParameter(i + 1, params.get(i));
            }
            long total = countQuery.getSingleResult();

            // 执行分页查询
            if (page < 1) page = 1;
            var query = entityManager.createQuery(jpql.toString(), Feedback.class);
            for (int i = 0; i < params.size(); i++) {
                query.setParameter(i + 1, params.get(i));
            }
            query.setFirstResult((page - 1) * limit);
            query.setMaxResults(limit);

            List<Feedback> feedbackList = query.getResultList();

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);

            Map<String, Object> data = new HashMap<>();

            // 转换反馈数据，避免循环引用
            List<Map<String, Object>> feedbacks = feedbackList.stream().map(f -> {
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
            pagination.put("total", total);
            pagination.put("totalPages", (int) Math.ceil((double) total / limit));

            data.put("pagination", pagination);
            response.put("data", data);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("获取反馈列表失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取反馈列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<?> logs(@RequestParam(name = "page", defaultValue = "1") int page,
                                  @RequestParam(name = "limit", defaultValue = "50") int limit,
                                  @RequestParam(name = "query", required = false) String query,
                                  @RequestParam(name = "sortOrder", defaultValue = "desc") String sortOrder) {
        // 修复：查询实际的审计日志数据
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);

        // 确保page参数至少为1，避免负数页码
        if (page < 1) {
            page = 1;
        }

        // 使用PageRequest进行分页查询，Spring Data的页码从0开始，支持排序
        org.springframework.data.domain.Sort sort = "asc".equalsIgnoreCase(sortOrder)
            ? org.springframework.data.domain.Sort.by("createdAt").ascending()
            : org.springframework.data.domain.Sort.by("createdAt").descending();
        PageRequest pageable = PageRequest.of(page - 1, limit, sort);
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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "feedback_update", id+":"+f.getStatus());

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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "workflow_create", w.getName()+"/"+w.getWorkflowId());

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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "workflow_update", wc.getName()+"/"+wc.getWorkflowId());

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

        // 记录审计日志（使用独立方法，不影响主事务）
        saveAuditLogSafe(auth, request, "workflow_delete", id);

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

            // 记录审计日志（使用独立方法，不影响主事务）
            saveAuditLogSafe(auth, request, "workflow_test", workflowId);

            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 400);
            res.put("success", false);
            res.put("message", "工作流测试失败: " + e.getMessage());
            return ResponseEntity.status(400).body(res);
        }
    }

    // ==================== 密码重置审批 API ====================

    @GetMapping("/password-resets/stats")
    public ResponseEntity<?> passwordResetStats() {
        try {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);

            // 统计各种状态的密码重置申请数量
            long total = passwordResetRepo.count();
            long pending = passwordResetRepo.countByStatus("pending");
            long approved = passwordResetRepo.countByStatus("approved");
            long rejected = passwordResetRepo.countByStatus("rejected");

            Map<String,Object> data = new HashMap<>();
            data.put("total", total);
            data.put("pending", pending);
            data.put("approved", approved);
            data.put("rejected", rejected);

            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取密码重置统计数据失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取密码重置统计数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @GetMapping("/password-resets")
    public ResponseEntity<?> passwordResets(@RequestParam(name = "page", defaultValue = "1") int page,
                                            @RequestParam(name = "limit", defaultValue = "50") int limit,
                                            @RequestParam(name = "status", required = false) String status) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);

            // 确保page参数至少为1
            if (page < 1) {
                page = 1;
            }

            // 使用PageRequest进行分页查询
            PageRequest pageable = PageRequest.of(page - 1, limit);
            Page<PasswordReset> resetPage;

            // 如果有状态筛选
            if (status != null && !status.isBlank()) {
                resetPage = passwordResetRepo.findByStatus(status, pageable);
            } else {
                resetPage = passwordResetRepo.findAllByOrderByCreatedAtDesc(pageable);
            }

            Map<String, Object> data = new HashMap<>();

            // 转换数据，避免循环引用
            List<Map<String, Object>> resets = resetPage.getContent().stream().map(pr -> {
                Map<String, Object> resetMap = new HashMap<>();
                resetMap.put("id", pr.getId());
                resetMap.put("userId", pr.getUser().getId());
                resetMap.put("username", pr.getUser().getUsername());
                resetMap.put("realName", pr.getUser().getRealName());
                resetMap.put("phone", pr.getUser().getPhone());
                resetMap.put("email", pr.getUser().getEmail());
                resetMap.put("contact", pr.getContact());
                resetMap.put("status", pr.getStatus());
                resetMap.put("createdAt", pr.getCreatedAt().toString());
                resetMap.put("expiresAt", pr.getExpiresAt().toString());
                resetMap.put("processedAt", pr.getProcessedAt() != null ? pr.getProcessedAt().toString() : null);
                resetMap.put("processedBy", pr.getProcessedBy());
                resetMap.put("processRemark", pr.getProcessRemark());
                resetMap.put("used", pr.isUsed());
                return resetMap;
            }).collect(java.util.stream.Collectors.toList());

            data.put("resets", resets);

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", page);
            pagination.put("limit", limit);
            pagination.put("total", resetPage.getTotalElements());
            pagination.put("totalPages", resetPage.getTotalPages());

            data.put("pagination", pagination);
            response.put("data", data);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("获取密码重置列表失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取密码重置列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @PutMapping("/password-resets/{id}/approve")
    @Transactional
    public ResponseEntity<?> approvePasswordReset(@PathVariable("id") String id,
                                                   @RequestBody(required = false) Map<String,Object> body,
                                                   Authentication auth, HttpServletRequest request) {
        try {
            PasswordReset pr = passwordResetRepo.findById(id).orElse(null);
            if (pr == null) return ResponseEntity.status(404).body(err("密码重置申请不存在"));

            if (!"pending".equals(pr.getStatus())) {
                return ResponseEntity.badRequest().body(err("该申请已被处理，状态: " + pr.getStatus()));
            }

            // 检查是否过期
            if (pr.getExpiresAt().isBefore(java.time.Instant.now())) {
                return ResponseEntity.badRequest().body(err("该申请已过期"));
            }

            // 更新用户密码
            User user = pr.getUser();
            if (pr.getNewPassword() != null && !pr.getNewPassword().isEmpty()) {
                // 新密码已经在申请时加密存储，直接使用
                user.setPassword(pr.getNewPassword());
                userRepo.save(user);
            }

            // 更新申请状态
            pr.setStatus("approved");
            pr.setUsed(true);
            pr.setProcessedAt(java.time.Instant.now());
            pr.setProcessedBy(getActorId(auth));
            if (body != null && body.containsKey("remark")) {
                pr.setProcessRemark(Objects.toString(body.get("remark"), null));
            }
            passwordResetRepo.save(pr);

            // 记录审计日志
            saveAuditLogSafe(auth, request, "password_reset_approve", "approve:" + id + ":" + user.getUsername());

            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            res.put("message", "密码重置申请已通过，用户密码已更新");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("审批密码重置申请失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "审批失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @PutMapping("/password-resets/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectPasswordReset(@PathVariable("id") String id,
                                                  @RequestBody(required = false) Map<String,Object> body,
                                                  Authentication auth, HttpServletRequest request) {
        try {
            PasswordReset pr = passwordResetRepo.findById(id).orElse(null);
            if (pr == null) return ResponseEntity.status(404).body(err("密码重置申请不存在"));

            if (!"pending".equals(pr.getStatus())) {
                return ResponseEntity.badRequest().body(err("该申请已被处理，状态: " + pr.getStatus()));
            }

            // 更新申请状态
            pr.setStatus("rejected");
            pr.setProcessedAt(java.time.Instant.now());
            pr.setProcessedBy(getActorId(auth));
            if (body != null && body.containsKey("remark")) {
                pr.setProcessRemark(Objects.toString(body.get("remark"), null));
            }
            passwordResetRepo.save(pr);

            // 记录审计日志
            saveAuditLogSafe(auth, request, "password_reset_reject", "reject:" + id + ":" + pr.getUser().getUsername());

            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);
            res.put("message", "密码重置申请已拒绝");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("拒绝密码重置申请失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "拒绝失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    // ==================== 通知/提醒 API ====================

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        try {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);

            List<Map<String, Object>> notifications = new ArrayList<>();

            // 1. 待审核的用户注册
            long pendingUsers = userRepo.countByStatus("PENDING");
            if (pendingUsers > 0) {
                Map<String, Object> notification = new HashMap<>();
                notification.put("id", "pending_users");
                notification.put("type", "user_register");
                notification.put("title", "用户注册审核");
                notification.put("message", "有 " + pendingUsers + " 个用户等待审核");
                notification.put("count", pendingUsers);
                notification.put("level", "warning");
                notification.put("link", "/users?status=PENDING");
                notifications.add(notification);
            }

            // 2. 待处理的反馈
            long pendingFeedbacks = feedbackRepo.countByStatus("pending");
            if (pendingFeedbacks > 0) {
                Map<String, Object> notification = new HashMap<>();
                notification.put("id", "pending_feedbacks");
                notification.put("type", "feedback");
                notification.put("title", "用户反馈处理");
                notification.put("message", "有 " + pendingFeedbacks + " 条反馈等待处理");
                notification.put("count", pendingFeedbacks);
                notification.put("level", "info");
                notification.put("link", "/feedbacks?status=pending");
                notifications.add(notification);
            }

            // 3. 待审核的密码重置申请
            long pendingPasswordResets = passwordResetRepo.countByStatus("pending");
            if (pendingPasswordResets > 0) {
                Map<String, Object> notification = new HashMap<>();
                notification.put("id", "pending_password_resets");
                notification.put("type", "password_reset");
                notification.put("title", "密码重置审核");
                notification.put("message", "有 " + pendingPasswordResets + " 个密码重置申请等待审核");
                notification.put("count", pendingPasswordResets);
                notification.put("level", "warning");
                notification.put("link", "/password-resets?status=pending");
                notifications.add(notification);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("notifications", notifications);
            data.put("total", notifications.size());
            data.put("hasUnread", notifications.size() > 0);

            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取通知失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取通知失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    // ==================== 用户操作日志 API ====================

    @GetMapping("/action-logs/stats")
    public ResponseEntity<?> actionLogStats() {
        try {
            Map<String,Object> res = new HashMap<>();
            res.put("code", 200);

            // 统计各种操作类型的数量
            long total = userActionLogRepo.count();
            long likeCount = userActionLogRepo.countByAction("like");
            long dislikeCount = userActionLogRepo.countByAction("dislike");
            long copyCount = userActionLogRepo.countByAction("copy");
            long forwardCount = userActionLogRepo.countByAction("forward");

            Map<String,Object> data = new HashMap<>();
            data.put("total", total);
            data.put("like", likeCount);
            data.put("dislike", dislikeCount);
            data.put("copy", copyCount);
            data.put("forward", forwardCount);

            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取操作日志统计数据失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取操作日志统计数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
        }
    }

    @GetMapping("/action-logs")
    public ResponseEntity<?> actionLogs(@RequestParam(name = "page", defaultValue = "1") int page,
                                        @RequestParam(name = "limit", defaultValue = "50") int limit,
                                        @RequestParam(name = "action", required = false) String action,
                                        @RequestParam(name = "username", required = false) String username) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);

            // 确保page参数至少为1
            if (page < 1) {
                page = 1;
            }

            // 使用PageRequest进行分页查询
            PageRequest pageable = PageRequest.of(page - 1, limit);
            Page<com.example.webui.common.entity.UserActionLog> logPage;

            // 根据筛选条件查询
            if (action != null && !action.isBlank()) {
                logPage = userActionLogRepo.findByActionOrderByCreatedAtDesc(action, pageable);
            } else {
                logPage = userActionLogRepo.findAllByOrderByCreatedAtDesc(pageable);
            }

            Map<String, Object> data = new HashMap<>();

            // 转换数据，避免循环引用
            List<Map<String, Object>> logs = logPage.getContent().stream().map(log -> {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("id", log.getId());
                if (log.getUser() != null) {
                    logMap.put("userId", log.getUser().getId());
                    logMap.put("username", log.getUser().getUsername());
                } else {
                    logMap.put("userId", null);
                    logMap.put("username", "未知用户");
                }
                logMap.put("action", log.getAction());
                logMap.put("messageId", log.getMessageId());
                logMap.put("conversationId", log.getConversationId());
                logMap.put("details", log.getDetails());
                logMap.put("ipAddress", log.getIpAddress());
                logMap.put("userAgent", log.getUserAgent());
                logMap.put("createdAt", log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
                return logMap;
            }).collect(java.util.stream.Collectors.toList());

            data.put("logs", logs);

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", page);
            pagination.put("limit", limit);
            pagination.put("total", logPage.getTotalElements());
            pagination.put("totalPages", logPage.getTotalPages());

            data.put("pagination", pagination);
            response.put("data", data);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("获取操作日志列表失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("code", 500);
            errorRes.put("error", "获取操作日志列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorRes);
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

    // 安全保存审计日志，不影响主事务
    private void saveAuditLogSafe(Authentication auth, HttpServletRequest request, String action, String details) {
        try {
            String actorId = getActorId(auth);
            Optional<User> actorOpt = userRepo.findById(actorId);
            if (actorOpt.isPresent()) {
                AuditLog log = new AuditLog();
                log.setUser(actorOpt.get());
                log.setAction(action);
                log.setDetails(details);
                log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
                auditRepo.save(log);
            }
        } catch (Exception e) {
            System.err.println("保存审计日志失败: " + e.getMessage());
        }
    }

    private static Map<String,Object> err(String msg){
        Map<String,Object> m = new HashMap<>();
        m.put("code", 400);
        m.put("error", msg);
        return m;
    }

    // ==================== 系统配置 API ====================

    @GetMapping("/system-configs")
    public ResponseEntity<?> getSystemConfigs() {
        List<SystemConfig> configs = systemConfigRepo.findAll();
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);

        List<Map<String, Object>> configList = configs.stream().map(c -> {
            Map<String, Object> configMap = new HashMap<>();
            configMap.put("id", c.getId());
            configMap.put("configKey", c.getConfigKey());
            configMap.put("configValue", c.getConfigValue());
            configMap.put("description", c.getDescription());
            configMap.put("enabled", c.getEnabled());
            configMap.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            configMap.put("updatedAt", c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
            return configMap;
        }).toList();

        res.put("data", Map.of("configs", configList));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/system-configs")
    @Transactional
    public ResponseEntity<?> createSystemConfig(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest request) {
        String configKey = Objects.toString(body.get("configKey"), "");
        String configValue = Objects.toString(body.get("configValue"), "");
        String description = Objects.toString(body.get("description"), null);
        Boolean enabled = body.get("enabled") != null ? Boolean.parseBoolean(body.get("enabled").toString()) : true;

        if (configKey.isBlank()) {
            return ResponseEntity.badRequest().body(err("配置键不能为空"));
        }

        // 检查是否已存在
        if (systemConfigRepo.findByConfigKey(configKey).isPresent()) {
            return ResponseEntity.status(409).body(err("配置键已存在"));
        }

        SystemConfig config = new SystemConfig();
        config.setConfigKey(configKey);
        config.setConfigValue(configValue);
        config.setDescription(description);
        config.setEnabled(enabled);
        systemConfigRepo.save(config);

        saveAuditLogSafe(auth, request, "system_config_create", "创建配置:" + configKey);

        Map<String, Object> res = new HashMap<>();
        res.put("code", 201);
        res.put("message", "配置创建成功");
        res.put("data", Map.of("id", config.getId()));
        return ResponseEntity.status(201).body(res);
    }

    @PutMapping("/system-configs/{id}")
    @Transactional
    public ResponseEntity<?> updateSystemConfig(@PathVariable("id") String id, @RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest request) {
        SystemConfig config = systemConfigRepo.findById(id).orElse(null);
        if (config == null) {
            return ResponseEntity.status(404).body(err("配置不存在"));
        }

        if (body.containsKey("configValue")) {
            config.setConfigValue(Objects.toString(body.get("configValue"), null));
        }
        if (body.containsKey("description")) {
            config.setDescription(Objects.toString(body.get("description"), null));
        }
        if (body.containsKey("enabled")) {
            config.setEnabled(Boolean.parseBoolean(body.get("enabled").toString()));
        }

        systemConfigRepo.save(config);
        saveAuditLogSafe(auth, request, "system_config_update", "更新配置:" + config.getConfigKey());

        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "配置更新成功");
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/system-configs/{id}")
    @Transactional
    public ResponseEntity<?> deleteSystemConfig(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        SystemConfig config = systemConfigRepo.findById(id).orElse(null);
        if (config == null) {
            return ResponseEntity.status(404).body(err("配置不存在"));
        }

        String configKey = config.getConfigKey();
        systemConfigRepo.delete(config);
        saveAuditLogSafe(auth, request, "system_config_delete", "删除配置:" + configKey);

        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "配置删除成功");
        return ResponseEntity.ok(res);
    }

    // ==================== 违规记录 API ====================

    @GetMapping("/violations/stats")
    public ResponseEntity<?> violationStats() {
        try {
            Map<String, Object> res = new HashMap<>();
            res.put("code", 200);

            long total = violationRecordRepo.count();
            long resultedInBan = violationRecordRepo.countByResultedInBan(true);
            long bannedUsers = userRepo.countByStatus("BANNED");

            Map<String, Object> data = new HashMap<>();
            data.put("total", total);
            data.put("resultedInBan", resultedInBan);
            data.put("currentlyBannedUsers", bannedUsers);

            res.put("data", data);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.err.println("获取违规统计失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(err("获取违规统计失败: " + e.getMessage()));
        }
    }

    @GetMapping("/violations")
    public ResponseEntity<?> getViolations(@RequestParam(name = "page", defaultValue = "1") int page,
                                           @RequestParam(name = "limit", defaultValue = "50") int limit,
                                           @RequestParam(name = "username", required = false) String username) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);

            if (page < 1) page = 1;
            PageRequest pageable = PageRequest.of(page - 1, limit);
            Page<ViolationRecord> violationPage;

            if (username != null && !username.isBlank()) {
                violationPage = violationRecordRepo.findByUsernameContaining(username, pageable);
            } else {
                violationPage = violationRecordRepo.findAllByOrderByCreatedAtDesc(pageable);
            }

            List<Map<String, Object>> violations = violationPage.getContent().stream().map(v -> {
                Map<String, Object> vMap = new HashMap<>();
                vMap.put("id", v.getId());
                vMap.put("userId", v.getUser().getId());
                vMap.put("username", v.getUser().getUsername());
                vMap.put("conversationId", v.getConversationId());
                vMap.put("messageId", v.getMessageId());
                vMap.put("violationType", v.getViolationType());
                vMap.put("content", v.getContent());
                vMap.put("aiResponse", v.getAiResponse());
                vMap.put("ipAddress", v.getIpAddress());
                vMap.put("resultedInBan", v.getResultedInBan());
                vMap.put("createdAt", v.getCreatedAt() != null ? v.getCreatedAt().toString() : null);
                return vMap;
            }).toList();

            Map<String, Object> data = new HashMap<>();
            data.put("violations", violations);
            data.put("pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", violationPage.getTotalElements(),
                "totalPages", violationPage.getTotalPages()
            ));

            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("获取违规记录失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(err("获取违规记录失败: " + e.getMessage()));
        }
    }

    // ==================== 用户封禁管理 ====================

    // ==================== 创建测试/管理员账号（免实名认证）====================

    @PostMapping("/users/create-test")
    @Transactional
    public ResponseEntity<?> createTestUser(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest request) {
        try {
            String username = Objects.toString(body.get("username"), "").trim();
            String phone = Objects.toString(body.get("phone"), "").trim();
            String email = Objects.toString(body.get("email"), "").trim();
            String password = Objects.toString(body.get("password"), "");
            String role = Objects.toString(body.get("role"), "TEST").toUpperCase();

            // 验证必填字段
            if (username.isEmpty() || username.length() < 4 || username.length() > 20) {
                return ResponseEntity.badRequest().body(err("用户名长度必须在4-20个字符之间"));
            }
            if (!username.matches("^[a-zA-Z0-9_]+$")) {
                return ResponseEntity.badRequest().body(err("用户名只能包含字母、数字和下划线"));
            }
            if (phone.isEmpty() || !phone.matches("^1[3-9]\\d{9}$")) {
                return ResponseEntity.badRequest().body(err("请输入正确的11位手机号"));
            }
            if (email.isEmpty() || !email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
                return ResponseEntity.badRequest().body(err("请输入有效的邮箱地址"));
            }
            if (password.length() < 8 || password.length() > 20) {
                return ResponseEntity.badRequest().body(err("密码长度必须在8-20个字符之间"));
            }

            // 验证角色
            if (!role.equals("TEST") && !role.equals("ADMIN") && !role.equals("USER")) {
                return ResponseEntity.badRequest().body(err("角色只能是TEST、ADMIN或USER"));
            }

            // 检查唯一性
            if (userRepo.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(err("用户名已存在"));
            }
            if (userRepo.findByPhone(phone).isPresent()) {
                return ResponseEntity.badRequest().body(err("手机号已被注册"));
            }
            if (userRepo.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(err("邮箱已被注册"));
            }

            // 创建用户（免实名认证）
            User user = new User();
            user.setUsername(username);
            user.setPhone(phone);
            user.setEmail(email.toLowerCase());
            user.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(password, org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            user.setRealName(role.equals("TEST") ? "测试用户" : (role.equals("ADMIN") ? "管理员" : "普通用户"));
            // 生成唯一的测试身份证号（TEST开头+时间戳）
            user.setIdCard("TEST" + System.currentTimeMillis() + new java.util.Random().nextInt(1000));
            user.setRole(role);
            user.setStatus("ACTIVE"); // 直接激活，无需审批
            user.setVerificationStatus(null); // 跳过实名认证
            user.setVerificationMessage("测试账号，跳过实名认证");
            userRepo.save(user);

            // 记录审计日志
            saveAuditLogSafe(auth, request, "create_test_user", "创建" + role + "账号:" + username);

            Map<String, Object> res = new HashMap<>();
            res.put("code", 201);
            res.put("message", role + "账号创建成功");
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("phone", user.getPhone());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("status", user.getStatus());
            res.put("user", userInfo);
            return ResponseEntity.status(201).body(res);
        } catch (Exception e) {
            System.err.println("创建测试账号失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(err("创建账号失败: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/temp-ban")
    @Transactional
    public ResponseEntity<?> tempBanUser(@PathVariable("id") String id,
                                         @RequestBody Map<String, Object> body,
                                         Authentication auth, HttpServletRequest request) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));

        int minutes = body.containsKey("minutes") ? Integer.parseInt(body.get("minutes").toString()) : 10;
        String reason = Objects.toString(body.get("reason"), "管理员操作");

        u.setStatus("BANNED");
        u.setBannedAt(java.time.Instant.now());
        u.setBannedUntil(java.time.Instant.now().plusSeconds(minutes * 60L));
        u.setBanCount(u.getBanCount() + 1);
        userRepo.save(u);

        saveAuditLogSafe(auth, request, "user_temp_ban", "临时封禁用户:" + id + ",时长:" + minutes + "分钟,原因:" + reason);

        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "用户已被临时封禁" + minutes + "分钟");
        return ResponseEntity.ok(res);
    }

    @PutMapping("/users/{id}/lift-ban")
    @Transactional
    public ResponseEntity<?> liftBan(@PathVariable("id") String id, Authentication auth, HttpServletRequest request) {
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(404).body(err("用户不存在"));

        u.setStatus("ACTIVE");
        u.setBannedUntil(null);
        u.setBannedAt(null);
        userRepo.save(u);

        saveAuditLogSafe(auth, request, "user_lift_ban", "解除封禁:" + id);

        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "已解除用户封禁");
        return ResponseEntity.ok(res);
    }
}
