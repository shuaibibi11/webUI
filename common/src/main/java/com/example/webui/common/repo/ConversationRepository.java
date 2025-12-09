package com.example.webui.common.repo;

import com.example.webui.common.entity.Conversation;
import com.example.webui.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, String> {
    Page<Conversation> findByUser(User user, Pageable pageable);
    Page<Conversation> findByUserAndIsDeletedFalse(User user, Pageable pageable);
    Optional<Conversation> findByIdAndUser(String id, User user);
    Optional<Conversation> findByIdAndUserAndIsDeletedFalse(String id, User user);
    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);
    List<Conversation> findByUserAndIsDeletedFalseOrderByUpdatedAtDesc(User user);
    Page<Conversation> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    List<Conversation> findByTitleContainingIgnoreCase(String title);
}
