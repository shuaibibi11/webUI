package com.example.webui.common.repo;

import com.example.webui.common.entity.AuditLog;
import com.example.webui.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
    List<AuditLog> findTop200ByActionContainingIgnoreCaseOrIpContainingIgnoreCaseOrderByCreatedAtDesc(String action, String ip);
    void deleteByUser(User user);
}
