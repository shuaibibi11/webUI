package com.example.webui.adminapi.controller;

import com.example.webui.common.entity.User;
import com.example.webui.common.entity.AuditLog;
import com.example.webui.common.repo.UserRepository;
import com.example.webui.common.repo.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import jakarta.annotation.security.PermitAll;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin/auth")
@SuppressWarnings("null")
public class AdminAuthController {

    @Autowired
    private UserRepository userRepo;
    
    @Autowired
    private AuditLogRepository auditRepo;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request, HttpServletResponse response) {
        String username = safe(body.get("username"));
        String password = safe(body.get("password"));
        
        // 查找用户
        Optional<User> userOpt = userRepo.findByUsername(username);
        if (username != null && username.contains("@") && userOpt.isEmpty()) {
            userOpt = userRepo.findByEmail(username);
        }
        if (userOpt.isEmpty() && username != null && username.matches("^[0-9]{6,20}$")) {
            userOpt = userRepo.findByPhone(username);
        }
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(err("用户名或邮箱不存在"));
        }
        
        User user = userOpt.get();
        
        // 检查密码
        if (!org.springframework.security.crypto.bcrypt.BCrypt.checkpw(password, user.getPassword())) {
            return ResponseEntity.status(401).body(err("密码错误"));
        }
        
        // 检查用户角色是否为管理员
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body(err("权限不足，需要管理员权限"));
        }

        // 生成JWT token
        String token = io.jsonwebtoken.Jwts.builder()
                .claim("userId", user.getId())
                .claim("username", user.getUsername())
                .claim("role", user.getRole())
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8)), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();

        // 设置cookie
        Cookie cookie = new Cookie("access_token", token);
        cookie.setMaxAge(7 * 24 * 60 * 60);
        cookie.setPath("/");
        cookie.setHttpOnly(false);
        response.addCookie(cookie);

        // 记录审计日志
        try {
            AuditLog log = new AuditLog();
            log.setUser(user);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            log.setAction("admin_login");
            log.setDetails("管理员登录");
            auditRepo.save(log);
        } catch (Exception ignored) {}
        
        // 返回响应
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "登录成功");
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("phone", user.getPhone());
        userInfo.put("email", user.getEmail());
        userInfo.put("realName", user.getRealName());
        userInfo.put("role", user.getRole());
        
        res.put("user", userInfo);
        res.put("token", token);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/info")
    public ResponseEntity<?> info(org.springframework.security.core.Authentication auth) {
        if (auth == null || auth.getDetails() == null) {
            return ResponseEntity.status(401).body(err("未提供认证令牌"));
        }
        
        Map<?,?> claims = (Map<?,?>) auth.getDetails();
        String userId = java.util.Objects.toString(claims.get("userId"), null);
        
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(err("用户不存在"));
        }
        
        User u = userOpt.get();
        
        // 检查用户角色是否为管理员
        if (!"ADMIN".equals(u.getRole())) {
            return ResponseEntity.status(403).body(err("权限不足，需要管理员权限"));
        }
        
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", u.getId());
        userInfo.put("username", u.getUsername());
        userInfo.put("phone", u.getPhone());
        userInfo.put("email", u.getEmail());
        userInfo.put("realName", u.getRealName());
        userInfo.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : Instant.now().toString());
        
        res.put("user", userInfo);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/bootstrap-admin")
    @Transactional
    @PermitAll
    public ResponseEntity<?> bootstrapAdmin() {
        // 检查是否已存在管理员账户
        List<User> adminList = userRepo.findByRole("ADMIN");
        if (!adminList.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("code", 200);
            res.put("message", "管理员账号已存在");
            return ResponseEntity.ok(res);
        }
        
        // 创建默认管理员账户
        User admin = new User();
        admin.setUsername("admin");
        admin.setPhone("13800138000");
        admin.setEmail("admin@example.com");
        admin.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
        admin.setRealName("系统管理员");
        admin.setIdCard("110101199001011234");
        admin.setRole("ADMIN");
        admin.setStatus("ACTIVE");
        admin.setCreatedAt(Instant.now());
        
        userRepo.save(admin);
        
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "管理员账号已创建");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // 清除cookie
        Cookie cookie = new Cookie("access_token", "");
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "退出成功");
        return ResponseEntity.ok(res);
    }

    private static String safe(String s) {
        return s == null ? null : s.trim();
    }
    
    private static Map<String,Object> err(String msg){ 
        Map<String,Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }
}