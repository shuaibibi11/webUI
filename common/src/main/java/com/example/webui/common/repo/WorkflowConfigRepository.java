package com.example.webui.common.repo;

import com.example.webui.common.entity.WorkflowConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkflowConfigRepository extends JpaRepository<WorkflowConfig, String> {
    List<WorkflowConfig> findByEnabledTrueOrderByUpdatedAtDesc();
}