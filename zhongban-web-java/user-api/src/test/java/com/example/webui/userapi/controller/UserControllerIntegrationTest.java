package com.example.webui.userapi.controller;

import com.example.webui.common.repo.UserRepository;
import com.example.webui.userapi.WebUiUserApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = WebUiUserApplication.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("null")
public class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepo;

    @BeforeEach
    public void setUp() {
        // 清除测试数据
        userRepo.deleteAll();
    }

    @Test
    public void testRegisterAndLoginFlow() throws Exception {
        // 1. 注册用户
        String registerJson = "{\"username\": \"testuser\",\"phone\": \"13800138000\",\"email\": \"test@example.com\",\"password\": \"Password123!\",\"realName\": \"测试用户\",\"idCard\": \"110101199001011234\"}";

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("注册成功"))
                .andExpect(jsonPath("$.user.username").value("testuser"));

        // 2. 登录用户
        String loginJson = "{\"username\": \"testuser\",\"password\": \"Password123!\"}";

        MvcResult loginResult = mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("登录成功"))
                .andExpect(jsonPath("$.token").exists())
                .andReturn();

        // 3. 使用token获取用户信息
        String token = loginResult.getResponse().getContentAsString()
                .replaceAll(".*\\\"token\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(get("/api/users/info")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.realName").value("测试用户"));
    }

    @Test
    public void testBootstrapAdminAndLogin() throws Exception {
        // 1. 引导创建管理员
        mockMvc.perform(post("/api/users/bootstrap-admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("管理员账号已确保存在"));

        // 2. 管理员登录
        String loginJson = "{\"username\": \"admin\",\"password\": \"Abcdef1!\"}";

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("登录成功"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    public void testPasswordResetFlow() throws Exception {
        // 1. 先注册一个用户
        String registerJson = "{\"username\": \"testuser\",\"phone\": \"13800138000\",\"email\": \"test@example.com\",\"password\": \"Password123!\",\"realName\": \"测试用户\",\"idCard\": \"110101199001011234\"}";

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isCreated());

        // 2. 请求密码重置
        String resetRequestJson = "{\"identifier\": \"testuser\"}";

        MvcResult resetRequestResult = mockMvc.perform(post("/api/users/password-reset/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(resetRequestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();

        // 3. 确认密码重置
        String token = resetRequestResult.getResponse().getContentAsString()
                .replaceAll(".*\\\"token\\\":\\\"([^\\\"]+)\\\".*", "$1");

        String resetConfirmJson = "{\"token\": \"" + token + "\",\"newPassword\": \"NewPassword123!\"}";

        mockMvc.perform(post("/api/users/password-reset/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(resetConfirmJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("密码已重置，请使用新密码登录"));

        // 4. 使用新密码登录
        String loginJson = "{\"username\": \"testuser\",\"password\": \"NewPassword123!\"}";

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("登录成功"));
    }

    @Test
    public void testInvalidRegister() throws Exception {
        // 测试无效的注册请求 - 用户名太短
        String invalidRegisterJson = "{\"username\": \"t\",\"phone\": \"13800138000\",\"email\": \"test@example.com\",\"password\": \"Password123!\",\"realName\": \"测试用户\",\"idCard\": \"110101199001011234\"}";

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRegisterJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("用户名长度必须在2-50个字符之间"));

        // 测试无效的注册请求 - 密码太短
        invalidRegisterJson = "{\"username\": \"testuser\",\"phone\": \"13800138000\",\"email\": \"test@example.com\",\"password\": \"1234567\",\"realName\": \"测试用户\",\"idCard\": \"110101199001011234\"}";

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRegisterJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("密码长度必须在8-128个字符之间"));
    }

    @Test
    public void testInvalidLogin() throws Exception {
        // 测试无效的登录请求 - 用户不存在
        String invalidLoginJson = "{\"username\": \"nonexistentuser\",\"password\": \"Password123!\"}";

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidLoginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("用户名或邮箱不存在"));

        // 测试无效的登录请求 - 密码错误
        // 先注册一个用户
        String registerJson = "{\"username\": \"testuser\",\"phone\": \"13800138000\",\"email\": \"test@example.com\",\"password\": \"Password123!\",\"realName\": \"测试用户\",\"idCard\": \"110101199001011234\"}";

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isCreated());

        // 使用错误的密码登录
        invalidLoginJson = "{\"username\": \"testuser\",\"password\": \"InvalidPassword!\"}";

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidLoginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("密码错误"));
    }
}
