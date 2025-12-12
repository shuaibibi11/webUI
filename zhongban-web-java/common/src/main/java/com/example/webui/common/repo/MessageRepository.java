package com.example.webui.common.repo;

import com.example.webui.common.entity.Message;
import com.example.webui.common.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

import java.time.Instant;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    Page<Message> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);
    List<Message> findByConversationOrderByCreatedAtDesc(Conversation conversation);
    List<Message> findByConversationAndCreatedAtLessThanOrderByCreatedAtDesc(Conversation conversation, Instant before, Pageable pageable);
    long countByConversation(Conversation conversation);
    long countByConversationAndRoleAndStatusNot(Conversation conversation, String role, String status);
    void deleteByConversation(Conversation conversation);
}
