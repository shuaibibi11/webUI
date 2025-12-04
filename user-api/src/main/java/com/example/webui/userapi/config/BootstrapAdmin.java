package com.example.webui.userapi.config;

import com.example.webui.common.entity.User;
import com.example.webui.common.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    @Autowired private UserRepository userRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
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
            if (!"ADMIN".equals(admin.getRole())) {
                admin.setRole("ADMIN");
                userRepo.save(admin);
            }
        }
    }
}
