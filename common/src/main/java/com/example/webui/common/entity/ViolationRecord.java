package com.example.webui.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "violation_records")
public class ViolationRecord {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "conversation_id", length = 36)
    private String conversationId;

    @Column(name = "message_id", length = 36)
    private String messageId;

    @Column(name = "violation_type", length = 50)
    private String violationType = "sensitive_content";  // 违规类型

    @Column(columnDefinition = "TEXT")
    private String content;  // 触发违规的内容

    @Column(name = "ai_response", columnDefinition = "TEXT")
    private String aiResponse;  // AI返回的违规提示

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "resulted_in_ban")
    private Boolean resultedInBan = false;  // 是否导致封禁

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public String getViolationType() { return violationType; }
    public void setViolationType(String violationType) { this.violationType = violationType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getAiResponse() { return aiResponse; }
    public void setAiResponse(String aiResponse) { this.aiResponse = aiResponse; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public Boolean getResultedInBan() { return resultedInBan; }
    public void setResultedInBan(Boolean resultedInBan) { this.resultedInBan = resultedInBan; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
