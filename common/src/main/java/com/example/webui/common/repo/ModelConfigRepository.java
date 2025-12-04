package com.example.webui.common.repo;

import com.example.webui.common.entity.ModelConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ModelConfigRepository extends JpaRepository<ModelConfig, String> {
    List<ModelConfig> findByEnabledTrueOrderByUpdatedAtDesc();
}
