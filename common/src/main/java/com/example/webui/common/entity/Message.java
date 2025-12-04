package com.example.webui.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(nullable = false)
    private String role; // user or assistant

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String status = "sent"; // sending, sent, failed, read

    @Column(name = "feedback_status")
    private String feedbackStatus = "none"; // like, dislike, none

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "prompt_tokens")
    private int promptTokens = 0;

    @Column(name = "completion_tokens")
    private int completionTokens = 0;

    @Column(name = "total_tokens")
    private int totalTokens = 0;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Conversation getConversation() { return conversation; }
    public void setConversation(Conversation conversation) { this.conversation = conversation; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFeedbackStatus() { return feedbackStatus; }
    public void setFeedbackStatus(String feedbackStatus) { this.feedbackStatus = feedbackStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public int getPromptTokens() { return promptTokens; }
    public void setPromptTokens(int promptTokens) { this.promptTokens = promptTokens; }
    public int getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(int completionTokens) { this.completionTokens = completionTokens; }
    public int getTotalTokens() { return totalTokens; }
    public void setTotalTokens(int totalTokens) { this.totalTokens = totalTokens; }
}
