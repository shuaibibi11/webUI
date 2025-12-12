package com.example.webui.common.repo;

import com.example.webui.common.entity.ViolationRecord;
import com.example.webui.common.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ViolationRecordRepository extends JpaRepository<ViolationRecord, String> {
    // 查询用户在某个会话中的违规次数
    long countByUserIdAndConversationId(String userId, String conversationId);

    // 查询用户总违规次数
    long countByUserId(String userId);

    // 分页查询所有违规记录
    Page<ViolationRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 按用户查询违规记录
    Page<ViolationRecord> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // 查询某时间段内的违规记录
    @Query("SELECT v FROM ViolationRecord v WHERE v.createdAt >= :startTime ORDER BY v.createdAt DESC")
    List<ViolationRecord> findRecentViolations(@Param("startTime") Instant startTime);

    // 统计导致封禁的违规次数
    long countByResultedInBan(Boolean resultedInBan);

    // 按用户名模糊搜索
    @Query("SELECT v FROM ViolationRecord v WHERE v.user.username LIKE %:username% ORDER BY v.createdAt DESC")
    Page<ViolationRecord> findByUsernameContaining(@Param("username") String username, Pageable pageable);

    void deleteByUser(User user);
}
