package com.example.webui.userapi.model;

public class Model {
    private String id;
    private String name;
    private String description;
    private String provider;
    private boolean active;

    public Model() {}

    public Model(String id, String name, String description, String provider, boolean active) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.provider = provider;
        this.active = active;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}