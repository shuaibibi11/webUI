package com.example.webui.common.repo;

import com.example.webui.common.entity.PasswordReset;
import com.example.webui.common.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, String> {
    Optional<PasswordReset> findByToken(String token);

    // 根据用户查找待处理的密码重置请求
    List<PasswordReset> findByUserAndStatus(User user, String status);

    // 根据状态查找密码重置请求（分页）
    Page<PasswordReset> findByStatus(String status, Pageable pageable);

    // 查找所有密码重置请求（分页）
    Page<PasswordReset> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 统计待处理的密码重置请求数量
    long countByStatus(String status);

    // 根据用户名或联系方式模糊搜索
    @Query("SELECT pr FROM PasswordReset pr JOIN pr.user u WHERE u.username LIKE %:keyword% OR pr.contact LIKE %:keyword%")
    Page<PasswordReset> searchByKeyword(String keyword, Pageable pageable);

    void deleteByUser(User user);
}
