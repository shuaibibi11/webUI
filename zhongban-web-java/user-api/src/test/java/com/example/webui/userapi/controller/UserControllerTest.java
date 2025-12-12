package com.example.webui.userapi.controller;

import com.example.webui.common.entity.User;
import com.example.webui.common.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.mockito.MockitoAnnotations;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class UserControllerTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private com.example.webui.common.repo.PasswordResetRepository passwordResetRepo;

    @Mock
    private com.example.webui.common.repo.AuditLogRepository auditRepo;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    public void setUp() {
        // 初始化mocks
        MockitoAnnotations.openMocks(this);
        // 设置JWT密钥
        org.springframework.test.util.ReflectionTestUtils.setField(userController, "jwtSecret", "test-secret-key");
    }

    @Test
    public void testRegister_Success() {
        // 准备测试数据
        Map<String, String> body = new HashMap<>();
        body.put("username", "testuser");
        body.put("phone", "13800138000");
        body.put("email", "test@example.com");
        body.put("password", "Password123!");
        body.put("realName", "测试用户");
        body.put("idCard", "110101199001011234");

        // 模拟Repository行为
        when(userRepo.findByUsername(anyString())).thenReturn(Optional.empty());
        when(userRepo.findByPhone(anyString())).thenReturn(Optional.empty());
        when(userRepo.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepo.findByRealNameAndIdCard(anyString(), anyString())).thenReturn(Optional.empty());
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("test-id");
            return user;
        });

        // 执行测试
        ResponseEntity<?> response = userController.register(body);

        // 验证结果
        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).save(any(User.class));
    }

    @Test
    public void testRegister_InvalidUsername() {
        // 准备测试数据 - 用户名太短
        Map<String, String> body = new HashMap<>();
        body.put("username", "t");
        body.put("phone", "13800138000");
        body.put("email", "test@example.com");
        body.put("password", "Password123!");
        body.put("realName", "测试用户");
        body.put("idCard", "110101199001011234");

        // 执行测试
        ResponseEntity<?> response = userController.register(body);

        // 验证结果
        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, never()).save(any(User.class));
    }

    @Test
    public void testLogin_Success() {
        // 准备测试数据
        Map<String, String> body = new HashMap<>();
        body.put("username", "testuser");
        body.put("password", "Password123!");

        // 创建测试用户
        User user = new User();
        user.setId("test-id");
        user.setUsername("testuser");
        user.setPassword("$2a$12$QjSH496pcT5CEbzjD/vtVeH03tfHKFy36d4J0Ltp3lRtee972r8yW"); // 密码: Password123!
        user.setPhone("13800138000");
        user.setEmail("test@example.com");
        user.setRealName("测试用户");
        user.setRole("USER");

        // 模拟Repository行为
        when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(user));

        // 执行测试
        ResponseEntity<?> response = userController.login(body, null, null);

        // 验证结果
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).findByUsername(anyString());
    }

    @Test
    public void testLogin_InvalidPassword() {
        // 准备测试数据
        Map<String, String> body = new HashMap<>();
        body.put("username", "testuser");
        body.put("password", "InvalidPassword!");

        // 创建测试用户
        User user = new User();
        user.setId("test-id");
        user.setUsername("testuser");
        user.setPassword("$2a$12$QjSH496pcT5CEbzjD/vtVeH03tfHKFy36d4J0Ltp3lRtee972r8yW"); // 密码: Password123!
        user.setPhone("13800138000");
        user.setEmail("test@example.com");
        user.setRealName("测试用户");
        user.setRole("USER");

        // 模拟Repository行为
        when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(user));

        // 执行测试
        ResponseEntity<?> response = userController.login(body, null, null);

        // 验证结果
        assertEquals(401, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).findByUsername(anyString());
    }

    @Test
    public void testBootstrapAdmin_CreatesNewAdmin() {
        // 模拟Repository行为 - 管理员不存在
        when(userRepo.findByUsername("admin")).thenReturn(Optional.empty());
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("admin-id");
            return user;
        });

        // 执行测试
        ResponseEntity<?> response = userController.bootstrapAdmin();

        // 验证结果
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).findByUsername("admin");
        verify(userRepo, times(1)).save(any(User.class));
    }

    @Test
    public void testBootstrapAdmin_UpdatesExistingAdmin() {
        // 创建测试管理员用户
        User admin = new User();
        admin.setId("admin-id");
        admin.setUsername("admin");
        admin.setRole("USER");

        // 模拟Repository行为 - 管理员已存在
        when(userRepo.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepo.save(any(User.class))).thenReturn(admin);

        // 执行测试
        ResponseEntity<?> response = userController.bootstrapAdmin();

        // 验证结果
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证管理员角色已更新
        assertEquals("ADMIN", admin.getRole());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).findByUsername("admin");
        verify(userRepo, times(2)).save(any(User.class));
    }

    @Test
    public void testInfo_Success() {
        // 创建测试用户
        User user = new User();
        user.setId("test-id");
        user.setUsername("testuser");
        user.setPhone("13800138000");
        user.setEmail("test@example.com");
        user.setRealName("测试用户");

        // 模拟认证和Repository行为
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "test-id");
        org.springframework.security.core.Authentication authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.getDetails()).thenReturn(claims);
        when(userRepo.findById("test-id")).thenReturn(Optional.of(user));

        // 执行测试
        ResponseEntity<?> response = userController.info(authentication);

        // 验证结果
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).findById("test-id");
    }

    @Test
    public void testInfo_UserNotFound() {
        // 模拟认证和Repository行为 - 用户不存在
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "non-existent-id");
        org.springframework.security.core.Authentication authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.getDetails()).thenReturn(claims);
        when(userRepo.findById("non-existent-id")).thenReturn(Optional.empty());

        // 执行测试
        ResponseEntity<?> response = userController.info(authentication);

        // 验证结果
        assertEquals(404, response.getStatusCode().value());
        assertNotNull(response.getBody());
        
        // 验证Repository方法是否被调用
        verify(userRepo, times(1)).findById("non-existent-id");
    }
}
