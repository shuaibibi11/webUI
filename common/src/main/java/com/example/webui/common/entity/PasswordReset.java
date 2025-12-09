package com.example.webui.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_resets")
public class PasswordReset {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // 新增字段：审批状态 (pending/approved/rejected)
    @Column(nullable = false)
    private String status = "pending";

    // 新增字段：新密码（加密存储）
    @Column(name = "new_password")
    private String newPassword;

    // 新增字段：联系方式
    @Column(name = "contact")
    private String contact;

    // 新增字段：审批时间
    @Column(name = "processed_at")
    private Instant processedAt;

    // 新增字段：审批人
    @Column(name = "processed_by")
    private String processedBy;

    // 新增字段：审批备注
    @Column(name = "process_remark")
    private String processRemark;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = Instant.now();
        if (status == null) status = "pending";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
    public String getProcessedBy() { return processedBy; }
    public void setProcessedBy(String processedBy) { this.processedBy = processedBy; }
    public String getProcessRemark() { return processRemark; }
    public void setProcessRemark(String processRemark) { this.processRemark = processRemark; }
}
