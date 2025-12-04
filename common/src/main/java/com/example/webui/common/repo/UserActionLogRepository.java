package com.example.webui.common.repo;

import com.example.webui.common.entity.UserActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserActionLogRepository extends JpaRepository<UserActionLog, String> {
    
    Page<UserActionLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    List<UserActionLog> findByMessageIdOrderByCreatedAtDesc(String messageId);
    
    List<UserActionLog> findByConversationIdOrderByCreatedAtDesc(String conversationId);
    
    @Query("SELECT l FROM UserActionLog l WHERE l.user.id = :userId AND l.action = :action ORDER BY l.createdAt DESC")
    Page<UserActionLog> findByUserIdAndActionOrderByCreatedAtDesc(@Param("userId") String userId, @Param("action") String action, Pageable pageable);
    
    @Query("SELECT COUNT(l) FROM UserActionLog l WHERE l.user.id = :userId AND l.action = :action")
    long countByUserIdAndAction(@Param("userId") String userId, @Param("action") String action);
}