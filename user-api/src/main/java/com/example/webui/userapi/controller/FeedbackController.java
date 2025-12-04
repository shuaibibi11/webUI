package com.example.webui.userapi.controller;

import com.example.webui.common.entity.Feedback;
import com.example.webui.common.entity.User;
import com.example.webui.common.repo.FeedbackRepository;
import com.example.webui.common.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/feedbacks")
public class FeedbackController {
    @Autowired private FeedbackRepository feedbackRepo;
    @Autowired private UserRepository userRepo;

    @PostMapping
    @Transactional
    public ResponseEntity<?> submit(Authentication auth, @RequestBody Map<String, String> body) {
        try {
            // 检查认证信息
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(401).body(err("用户未认证"));
            }
            
            // 调试认证信息
            System.out.println("Authentication details: " + auth.getDetails());
            System.out.println("Authentication principal: " + auth.getPrincipal());
            
            String userId = null;
            String username = null;
            
            if (auth.getDetails() instanceof Map) {
                Map<?,?> details = (Map<?,?>) auth.getDetails();
                userId = java.util.Objects.toString(details.get("userId"), null);
                username = java.util.Objects.toString(details.get("username"), null);
            }
            System.out.println("Extracted userId: " + userId + ", username: " + username);
            
            if (userId == null && username == null) {
                return ResponseEntity.status(401).body(err("用户未认证"));
            }
            
            User user = null;
            if (username != null && !username.isEmpty()) {
                user = userRepo.findByUsername(username).orElse(null);
            }
            if (user == null && userId != null && !userId.isEmpty()) {
                user = userRepo.findById(userId).orElse(null);
            }
            
            if (user == null) {
                return ResponseEntity.status(404).body(err("用户不存在"));
            }
            
            String type = Optional.ofNullable(body.get("type")).orElse("complaint");
            String content = Optional.ofNullable(body.get("content")).orElse("");
            String contact = body.get("contact");
            if (!(type.equals("complaint") || type.equals("report") || type.equals("suggestion"))) {
                return ResponseEntity.badRequest().body(err("无效的反馈类型"));
            }
            Feedback f = new Feedback();
            f.setUser(user); 
            f.setType(type); 
            f.setContent(content); 
            f.setContact(contact);
            feedbackRepo.save(f);
            
            System.out.println("反馈提交成功 - ID: " + f.getId() + ", 用户: " + user.getUsername() + ", 类型: " + type + ", 内容: " + content);
            
            Map<String,Object> res = new HashMap<>();
            res.put("code", 201);
            res.put("message", "反馈提交成功");
            res.put("feedback", Map.of(
                    "id", f.getId(), 
                    "userId", user.getId(), 
                    "type", f.getType(), 
                    "content", f.getContent(), 
                    "contact", f.getContact() != null ? f.getContact() : "", 
                    "status", f.getStatus()));
            return ResponseEntity.status(201).body(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(err("服务器内部错误: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(err("用户未认证"));
        }
        
        String userId = null;
        if (auth.getDetails() instanceof Map) {
            userId = java.util.Objects.toString(((Map<?,?>) auth.getDetails()).get("userId"), null);
        }
        
        if (userId == null) {
            return ResponseEntity.status(401).body(err("用户未认证"));
        }
        
        final String finalUserId = userId;
        User user = userRepo.findById(finalUserId).orElseThrow(() -> new RuntimeException("用户不存在: " + finalUserId));
        List<Feedback> list = feedbackRepo.findByUserOrderByCreatedAtDesc(user);
        List<Map<String,Object>> res = new ArrayList<>();
        for (Feedback f : list) {
            res.add(Map.of("id", f.getId(), "userId", finalUserId, "type", f.getType(), "content", f.getContent(), "contact", f.getContact(), "status", f.getStatus(), "createdAt", f.getCreatedAt().toString()));
        }
        Map<String,Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("feedbacks", res);
        return ResponseEntity.ok(response);
    }

    private static Map<String,Object> err(String msg){ 
        Map<String,Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }
}
