package com.example.webui.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "model_configs")
public class ModelConfig {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String endpoint;

    @Column
    private String apiKey;

    @Column(nullable = false)
    private String modelName;

    @Column(nullable = false)
    private String tag;

    @Column(nullable = false)
    private String protocol = "openai";

    @Column(nullable = false)
    private double temperature = 0.7;

    @Column(nullable = false)
    private int maxTokens = 8192;

    @Column(nullable = false)
    private double topP = 0.9;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User user;

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
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }
    public int getMaxTokens() { return maxTokens; }
    public void setMaxTokens(int maxTokens) { this.maxTokens = maxTokens; }
    public double getTopP() { return topP; }
    public void setTopP(double topP) { this.topP = topP; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
