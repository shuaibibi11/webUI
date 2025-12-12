package com.example.webui.common.repo;

import com.example.webui.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByRealNameAndIdCard(String realName, String idCard);
    List<User> findByRole(String role);

    // 检查邮箱是否已存在
    boolean existsByEmail(String email);

    // 按状态统计用户数量
    long countByStatus(String status);
    
    // 使用JPQL查询，只查询需要的字段，返回接口类型的投影
    @Query("SELECT u.id AS id, u.username AS username, u.phone AS phone, u.email AS email, u.realName AS realName, u.createdAt AS createdAt FROM User u")
    List<UserProjection> findAllUsers();
    
    // 投影接口，只包含需要的字段
    interface UserProjection {
        String getId();
        String getUsername();
        String getPhone();
        String getEmail();
        String getRealName();
        Instant getCreatedAt();
    }
}
