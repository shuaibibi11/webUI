package com.example.webui.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"username"}),
        @UniqueConstraint(columnNames = {"phone"}),
        @UniqueConstraint(columnNames = {"email"}),
        @UniqueConstraint(columnNames = {"id_card"})
})
public class User {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "real_name", nullable = false)
    private String realName;

    @Column(name = "id_card", nullable = false, unique = true)
    private String idCard;

    @Column(nullable = false)
    private String role = "USER";

    @Column(name = "last_login_ip")
    private String lastLoginIp;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "tokens_used")
    private Integer tokensUsed = 0;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Conversation> conversations = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Feedback> feedbacks = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AuditLog> logs = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModelConfig> models = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PasswordReset> passwordResets = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
    public String getIdCard() { return idCard; }
    public void setIdCard(String idCard) { this.idCard = idCard; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public Integer getTokensUsed() {
        return tokensUsed;
    }

    public void setTokensUsed(Integer tokensUsed) {
        this.tokensUsed = tokensUsed;
    }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<Conversation> getConversations() { return conversations; }
    public void setConversations(List<Conversation> conversations) { this.conversations = conversations; }
    public List<Feedback> getFeedbacks() { return feedbacks; }
    public void setFeedbacks(List<Feedback> feedbacks) { this.feedbacks = feedbacks; }
    public List<AuditLog> getLogs() { return logs; }
    public void setLogs(List<AuditLog> logs) { this.logs = logs; }
    public List<ModelConfig> getModels() { return models; }
    public void setModels(List<ModelConfig> models) { this.models = models; }
    public List<PasswordReset> getPasswordResets() { return passwordResets; }
    public void setPasswordResets(List<PasswordReset> passwordResets) { this.passwordResets = passwordResets; }
}
