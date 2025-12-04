package com.example.webui.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_configs")
public class WorkflowConfig {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "workflow_id", nullable = false)
    private String workflowId;

    @Column
    private String description;

    @Column(nullable = false)
    private String endpoint;

    @Column
    private String apiKey;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "config_json")
    private String configJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

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
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getWorkflowId() { return workflowId; }
    public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}