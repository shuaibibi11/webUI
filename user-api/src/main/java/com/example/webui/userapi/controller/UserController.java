package com.example.webui.userapi.controller;

import com.example.webui.common.entity.User;
import com.example.webui.common.entity.AuditLog;
import com.example.webui.common.repo.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
// validation annotations not used directly; remove jakarta imports for Java 11
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.Cookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

 
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
@SuppressWarnings("null")
public class UserController {

    @Autowired
    private UserRepository userRepo;
    @Autowired
    private com.example.webui.common.repo.PasswordResetRepository passwordResetRepo;
    @Autowired
    private com.example.webui.common.repo.AuditLogRepository auditRepo;
    @Autowired
    private com.example.webui.common.repo.ModelConfigRepository modelConfigRepo;
    @Autowired
    private com.example.webui.common.repo.WorkflowConfigRepository workflowConfigRepo;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = safe(body.get("username"));
        String phone = safe(body.get("phone"));
        String email = safe(body.get("email"));
        String password = safe(body.get("password"));
        String realName = safe(body.get("realName"));
        String idCard = safe(body.get("idCard"));

        if (username == null || username.length() < 2 || username.length() > 50) {
            return ResponseEntity.badRequest().body(err("用户名长度必须在2-50个字符之间"));
        }
        if (phone == null || phone.length() < 6 || phone.length() > 20) {
            return ResponseEntity.badRequest().body(err("手机号长度必须在6-20位之间"));
        }
        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest().body(err("请输入有效的邮箱地址"));
        }
        if (password == null || password.length() < 8 || password.length() > 128) {
            return ResponseEntity.badRequest().body(err("密码长度必须在8-128个字符之间"));
        }

        if (userRepo.findByUsername(username).isPresent()) return ResponseEntity.badRequest().body(err("用户名已存在"));
        if (userRepo.findByPhone(phone).isPresent()) return ResponseEntity.badRequest().body(err("手机号已被注册"));
        if (userRepo.findByEmail(email).isPresent()) return ResponseEntity.badRequest().body(err("邮箱已被注册"));
        if (userRepo.findByRealNameAndIdCard(realName, idCard).isPresent()) return ResponseEntity.badRequest().body(err("该实名信息已注册"));

        // 验证身份证格式
        if (!isValidIdCard(idCard.trim())) {
            return ResponseEntity.badRequest().body(err("身份证格式不正确"));
        }
        
        User u = new User();
        u.setUsername(username.trim());
        u.setPhone(phone.trim());
        u.setEmail(email.trim().toLowerCase());
        u.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(password, org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
        u.setRealName(realName.trim());
        u.setIdCard(idCard.trim());
        u.setStatus("PENDING"); // 注册后状态为待审核
        userRepo.save(u);

        Map<String, Object> res = new HashMap<>();
        res.put("code", 201);
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", u.getId());
        userInfo.put("username", u.getUsername());
        userInfo.put("phone", u.getPhone());
        userInfo.put("email", u.getEmail());
        userInfo.put("realName", u.getRealName());
        userInfo.put("createdAt", Instant.now().toString());
        res.put("message", "注册成功，账号待管理员审核通过后方可使用");
        res.put("user", userInfo);
        return ResponseEntity.status(201).body(res);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request, HttpServletResponse response) {
        String username = safe(body.get("username"));
        String password = safe(body.get("password"));
        Optional<User> userOpt = userRepo.findByUsername(username);
        if (username != null && username.contains("@") && userOpt.isEmpty()) {
            userOpt = userRepo.findByEmail(username);
        }
        if (userOpt.isEmpty() && username != null && username.matches("^[0-9]{6,20}$")) {
            userOpt = userRepo.findByPhone(username);
        }
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body(err("用户名或邮箱不存在"));
        User user = userOpt.get();
        if (!org.springframework.security.crypto.bcrypt.BCrypt.checkpw(password, user.getPassword())) {
            return ResponseEntity.status(401).body(err("密码错误"));
        }
        
        // 检查用户账号状态，只有ACTIVE状态的用户才能登录
        if (!"ACTIVE".equals(user.getStatus())) {
            if ("PENDING".equals(user.getStatus())) {
                return ResponseEntity.status(403).body(err("账号待审核，审核通过后方可登录"));
            } else {
                return ResponseEntity.status(403).body(err("账号已被禁用，请联系管理员"));
            }
        }

        String token = io.jsonwebtoken.Jwts.builder()
                .claim("userId", user.getId())
                .claim("username", user.getUsername())
                .claim("role", user.getRole())
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8)), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();

        Cookie cookie = new Cookie("access_token", token);
        cookie.setMaxAge(7 * 24 * 60 * 60);
        cookie.setPath("/");
        cookie.setHttpOnly(false);
        response.addCookie(cookie);

        try {
            AuditLog log = new AuditLog();
            log.setUser(user);
            log.setIp(request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For") : request.getRemoteAddr());
            log.setAction("login");
            log.setDetails("用户登录");
            auditRepo.save(log);
        } catch (Exception ignored) {}
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

    @PostMapping("/bootstrap-admin")
    @Transactional
    public ResponseEntity<?> bootstrapAdmin() {
        // Create or update admin account
        User admin = userRepo.findByUsername("admin").orElse(null);
        if (admin == null) {
            admin = new User();
            admin.setUsername("admin");
            admin.setPhone("13800138000");
            admin.setEmail("admin@example.com");
            admin.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            admin.setRealName("管理员");
            admin.setIdCard("110101199001010000");
            admin.setRole("ADMIN");
            userRepo.save(admin);
        } else {
            // Always update the password to ensure it's correctly hashed
            admin.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            if (!"ADMIN".equals(admin.getRole())) {
                admin.setRole("ADMIN");
            }
            userRepo.save(admin);
        }
        
        // Create or update admin2 account
        User admin2 = userRepo.findByUsername("admin2").orElse(null);
        if (admin2 == null) {
            admin2 = new User();
            admin2.setUsername("admin2");
            admin2.setPhone("13800138002");
            admin2.setEmail("admin2@example.com");
            admin2.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            admin2.setRealName("管理员2");
            admin2.setIdCard("110101199001010002");
            admin2.setRole("ADMIN");
            userRepo.save(admin2);
        } else {
            // Always update the password to ensure it's correctly hashed
            admin2.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            if (!"ADMIN".equals(admin2.getRole())) {
                admin2.setRole("ADMIN");
            }
            userRepo.save(admin2);
        }
        
        // Create or update admin3 account
        User admin3 = userRepo.findByUsername("admin3").orElse(null);
        if (admin3 == null) {
            admin3 = new User();
            admin3.setUsername("admin3");
            admin3.setPhone("13800138003");
            admin3.setEmail("admin3@example.com");
            admin3.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            admin3.setRealName("管理员3");
            admin3.setIdCard("110101199001010003");
            admin3.setRole("ADMIN");
            userRepo.save(admin3);
        } else {
            // Always update the password to ensure it's correctly hashed
            admin3.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("Abcdef1!", org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
            if (!"ADMIN".equals(admin3.getRole())) {
                admin3.setRole("ADMIN");
            }
            userRepo.save(admin3);
        }
        
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "所有管理员账号已确保存在");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/info")
    public ResponseEntity<?> info(Authentication auth) {
        if (auth == null || auth.getDetails() == null) return ResponseEntity.status(401).body(err("未提供认证令牌"));
        Map<?,?> claims = (Map<?,?>) auth.getDetails();
        String userId = java.util.Objects.toString(claims.get("userId"), null);
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(err("用户不存在"));
        User u = userOpt.get();
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
    
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        return info(auth);
    }
    
    @PutMapping("/password-change")
    @Transactional
    public ResponseEntity<?> passwordChange(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null || auth.getDetails() == null) return ResponseEntity.status(401).body(err("未提供认证令牌"));
        Map<?,?> claims = (Map<?,?>) auth.getDetails();
        String userId = java.util.Objects.toString(claims.get("userId"), null);
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(err("用户不存在"));
        
        User user = userOpt.get();
        String currentPassword = safe(body.get("currentPassword"));
        String newPassword = safe(body.get("newPassword"));
        
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(err("必须提供当前密码和新密码"));
        }
        
        if (!org.springframework.security.crypto.bcrypt.BCrypt.checkpw(currentPassword, user.getPassword())) {
            return ResponseEntity.status(401).body(err("当前密码错误"));
        }
        
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(err("密码长度必须至少为8个字符"));
        }
        
        user.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(newPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
        userRepo.save(user);
        
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message", "密码修改成功");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/password-reset/request")
    @Transactional
    public ResponseEntity<?> requestReset(@RequestBody Map<String,String> body) {
        String identifier = Optional.ofNullable(body.get("identifier")).orElse("");
        Optional<User> u = userRepo.findByUsername(identifier);
        if (identifier.contains("@") && u.isEmpty()) u = userRepo.findByEmail(identifier);
        if (u.isEmpty() && identifier.matches("^[0-9]{6,20}$")) u = userRepo.findByPhone(identifier);
        if (u.isEmpty()) return ResponseEntity.status(404).body(err("用户不存在"));
        String token = java.util.UUID.randomUUID().toString().replace("-", "");
        com.example.webui.common.entity.PasswordReset pr = new com.example.webui.common.entity.PasswordReset();
        pr.setUser(u.get()); pr.setToken(token); pr.setExpiresAt(java.time.Instant.now().plusSeconds(30*60));
        passwordResetRepo.save(pr);
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("token", token);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/password-reset/confirm")
    @Transactional
    public ResponseEntity<?> confirmReset(@RequestBody Map<String,String> body) {
        String token = Optional.ofNullable(body.get("token")).orElse("");
        String newPassword = Optional.ofNullable(body.get("newPassword")).orElse("");
        Optional<com.example.webui.common.entity.PasswordReset> opt = passwordResetRepo.findByToken(token);
        if (opt.isEmpty() || opt.get().isUsed() || opt.get().getExpiresAt().isBefore(java.time.Instant.now())) {
            return ResponseEntity.badRequest().body(err("重置链接无效或已过期"));
        }
        com.example.webui.common.entity.PasswordReset pr = opt.get();
        User u = pr.getUser();
        if (newPassword.length() < 8) return ResponseEntity.badRequest().body(err("密码长度必须在8-128个字符之间"));
        u.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(newPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt(12)));
        userRepo.save(u);
        pr.setUsed(true); passwordResetRepo.save(pr);
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("message","密码已重置，请使用新密码登录");
        return ResponseEntity.ok(res);
    }

    private static String safe(String s) { return s == null ? null : s.trim(); }

    private static Map<String, Object> err(String msg) { 
        Map<String, Object> m = new HashMap<>(); 
        m.put("code", 400);
        m.put("error", msg); 
        return m; 
    }
    
    // 身份证验证正则表达式
    private boolean isValidIdCard(String idCard) {
        // 18位身份证正则表达式
        String regex = "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$";
        return idCard.matches(regex);
    }

    @GetMapping("/models")
    public ResponseEntity<?> getAvailableModels() {
        // 获取所有启用的模型配置
        var enabledModels = modelConfigRepo.findByEnabledTrueOrderByUpdatedAtDesc();
        
        // 获取所有启用的工作流配置
        var enabledWorkflows = workflowConfigRepo.findByEnabledTrueOrderByUpdatedAtDesc();
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        
        Map<String, Object> data = new HashMap<>();
        
        // 转换模型数据，避免返回敏感信息
        var models = enabledModels.stream().map(m -> {
            Map<String, Object> modelMap = new HashMap<>();
            modelMap.put("id", m.getId());
            modelMap.put("name", m.getModelName());
            modelMap.put("tag", m.getTag());
            modelMap.put("provider", m.getProvider());
            modelMap.put("type", "model");
            return modelMap;
        }).toList();
        
        // 转换工作流数据
        var workflows = enabledWorkflows.stream().map(w -> {
            Map<String, Object> workflowMap = new HashMap<>();
            workflowMap.put("id", w.getId());
            workflowMap.put("name", w.getName());
            workflowMap.put("description", w.getDescription());
            workflowMap.put("type", "workflow");
            return workflowMap;
        }).toList();
        
        // 合并模型和工作流列表
        data.put("items", models);
        data.put("workflows", workflows);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }
}