package com.example.webui.common.repo;

import com.example.webui.common.entity.Feedback;
import com.example.webui.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    List<Feedback> findByUserOrderByCreatedAtDesc(User user);
    long countByStatus(String status);
}
