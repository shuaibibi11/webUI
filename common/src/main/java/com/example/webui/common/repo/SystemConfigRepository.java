package com.example.webui.common.repo;

import com.example.webui.common.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {
    Optional<SystemConfig> findByConfigKey(String configKey);

    Optional<SystemConfig> findByConfigKeyAndEnabled(String configKey, Boolean enabled);
}
