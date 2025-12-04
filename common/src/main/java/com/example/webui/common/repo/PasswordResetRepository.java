package com.example.webui.common.repo;

import com.example.webui.common.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, String> {
    Optional<PasswordReset> findByToken(String token);
}
