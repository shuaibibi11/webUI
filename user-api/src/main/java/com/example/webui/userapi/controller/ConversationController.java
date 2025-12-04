package com.example.webui.userapi.controller;

import com.example.webui.common.entity.Conversation;
import com.example.webui.common.entity.Message;
import com.example.webui.common.entity.User;
import com.example.webui.common.repo.ConversationRepository;
import com.example.webui.common.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping({"/conversations", "/api/conversations"})
@SuppressWarnings("null")
public class ConversationController {

    @Autowired private ConversationRepository conversationRepo;
    @Autowired private UserRepository userRepo;

    @GetMapping
    public ResponseEntity<?> list(Authentication auth,
                                  @RequestParam(name = "page", defaultValue = "1") int page,
                                  @RequestParam(name = "limit", defaultValue = "20") int limit) {
        // 检查认证信息
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 401);
            error.put("error", "未认证");
            return ResponseEntity.status(401).body(error);
        }
        
        System.out.println("DEBUG: Authentication details: " + auth.getDetails());
        System.out.println("DEBUG: Authentication principal: " + auth.getPrincipal());
        System.out.println("DEBUG: Authentication authorities: " + auth.getAuthorities());
        
        String userId = null;
        String username = null;
        
        if (auth.getDetails() instanceof Map) {
            Map<?,?> details = (Map<?,?>) auth.getDetails();
            userId = java.util.Objects.toString(details.get("userId"), null);
            username = java.util.Objects.toString(details.get("username"), null);
        }
        
        System.out.println("DEBUG: Extracted userId: " + userId);
        System.out.println("DEBUG: Extracted username: " + username);
        
        User user = null;
        if (username != null && !username.isEmpty()) {
            user = userRepo.findByUsername(username).orElse(null);
        }
        if (user == null && userId != null && !userId.isEmpty()) {
            // 如果通过用户名找不到，尝试通过userId查找
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        System.out.println("DEBUG: Found user: " + user.getUsername() + " with ID: " + user.getId());
        
        // 只获取未删除的会话（用户看不到已删除的会话）
        Page<Conversation> p = conversationRepo.findByUserAndIsDeletedFalse(user, PageRequest.of(Math.max(0, page-1), limit));
        List<Map<String,Object>> cons = new ArrayList<>();
        for (Conversation c : p.getContent()) {
            Map<String,Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("title", c.getTitle());
            m.put("createdAt", toStr(c.getCreatedAt()));
            m.put("updatedAt", toStr(c.getUpdatedAt()));
            m.put("unreadCount", 0);
            List<Message> msgs = c.getMessages();
            Message last = msgs.stream().max(Comparator.comparing(Message::getCreatedAt)).orElse(null);
            if (last != null) {
                Map<String,Object> lm = new HashMap<>();
                lm.put("id", last.getId());
                lm.put("conversationId", c.getId());
                lm.put("senderId", last.getRole().equals("user") ? userId : "assistant");
                lm.put("content", last.getContent());
                lm.put("type", "text");
                lm.put("status", last.getStatus());
                lm.put("createdAt", toStr(last.getCreatedAt()));
                m.put("lastMessage", lm);
            }
            cons.add(m);
        }
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("data", Map.of("conversations", cons, "pagination", Map.of("page", page, "limit", limit, "total", p.getTotalElements(), "totalPages", p.getTotalPages())));
        return ResponseEntity.ok(res);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(Authentication auth, @RequestBody Map<String, Object> body) {
        // 检查认证信息
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 401);
            error.put("error", "未认证");
            return ResponseEntity.status(401).body(error);
        }
        
        String userId = null;
        String username = null;
        
        if (auth.getDetails() instanceof Map) {
            Map<?,?> details = (Map<?,?>) auth.getDetails();
            userId = java.util.Objects.toString(details.get("userId"), null);
            username = java.util.Objects.toString(details.get("username"), null);
        }
        
        User user = null;
        if (username != null && !username.isEmpty()) {
            user = userRepo.findByUsername(username).orElse(null);
        }
        if (user == null && userId != null && !userId.isEmpty()) {
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        String title = Optional.ofNullable(body.get("title")).map(Object::toString).orElse("新对话");
        Conversation c = new Conversation();
        c.setUser(user);
        c.setTitle(title);
        conversationRepo.save(c);
        Map<String,Object> conv = new HashMap<>();
        conv.put("id", c.getId());
        conv.put("title", c.getTitle());
        conv.put("createdAt", toStr(c.getCreatedAt()));
        conv.put("updatedAt", toStr(c.getUpdatedAt()));
        conv.put("unreadCount", 0);
        Map<String,Object> res = new HashMap<>();
        res.put("code", 201);
        res.put("conversation", conv);
        return ResponseEntity.status(201).body(res);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(Authentication auth, @PathVariable String id) {
        // 检查认证信息
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 401);
            error.put("error", "未认证");
            return ResponseEntity.status(401).body(error);
        }
        
        String userId = null;
        String username = null;
        
        if (auth.getDetails() instanceof Map) {
            Map<?,?> details = (Map<?,?>) auth.getDetails();
            userId = java.util.Objects.toString(details.get("userId"), null);
            username = java.util.Objects.toString(details.get("username"), null);
        }
        
        User user = null;
        if (username != null && !username.isEmpty()) {
            user = userRepo.findByUsername(username).orElse(null);
        }
        if (user == null && userId != null && !userId.isEmpty()) {
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        Conversation c = conversationRepo.findByIdAndUser(id, user).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("对话不存在"));
        Map<String,Object> conv = new HashMap<>();
        conv.put("id", c.getId());
        conv.put("title", c.getTitle());
        conv.put("createdAt", toStr(c.getCreatedAt()));
        conv.put("updatedAt", toStr(c.getUpdatedAt()));
        conv.put("messages", c.getMessages());
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("conversation", conv);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(Authentication auth, @PathVariable String id, @RequestBody Map<String,Object> body) {
        String userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
        String username = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("username"), null);
        
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        Conversation c = conversationRepo.findByIdAndUser(id, user).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("对话不存在"));
        String title = Optional.ofNullable(body.get("title")).map(Object::toString).orElse(c.getTitle());
        c.setTitle(title);
        conversationRepo.save(c);
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("conversation", Map.of("id", c.getId(), "title", c.getTitle()));
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(Authentication auth, @PathVariable String id) {
        String userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
        String username = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("username"), null);
        
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        Conversation c = conversationRepo.findByIdAndUser(id, user).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("对话不存在"));
        // 软删除：只标记为已删除，不真正删除数据
        c.setDeleted(true);
        conversationRepo.save(c);
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "删除成功");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<?> stop(Authentication auth, @PathVariable String id) {
        String userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
        String username = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("username"), null);
        
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            user = userRepo.findById(userId).orElse(null);
        }
        
        if (user == null) {
            Map<String,Object> error = new HashMap<>();
            error.put("code", 404);
            error.put("error", "用户不存在");
            return ResponseEntity.status(404).body(error);
        }
        
        Conversation c = conversationRepo.findByIdAndUser(id, user).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(err("对话不存在"));
        
        // 这里可以添加停止对话的具体逻辑，比如停止正在进行的AI生成等
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "对话已停止");
        return ResponseEntity.ok(res);
    }

    private static String toStr(Instant t) { return t == null ? null : t.toString(); }
    private static Map<String,Object> err(String msg){ 
        Map<String,Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }
}
