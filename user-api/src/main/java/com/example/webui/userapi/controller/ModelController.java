package com.example.webui.userapi.controller;

import com.example.webui.common.repo.ModelConfigRepository;
import com.example.webui.common.repo.WorkflowConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/models", "/api/models"})
public class ModelController {

    @Autowired
    private ModelConfigRepository modelConfigRepo;
    
    @Autowired
    private WorkflowConfigRepository workflowConfigRepo;

    @GetMapping
    public ResponseEntity<?> getModels() {
        // 获取所有启用的模型配置
        var enabledModels = modelConfigRepo.findByEnabledTrueOrderByUpdatedAtDesc();
        
        // 获取所有启用的工作流配置
        var enabledWorkflows = workflowConfigRepo.findByEnabledTrueOrderByUpdatedAtDesc();
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        
        Map<String, Object> data = new HashMap<>();
        
        // 转换模型数据，避免返回敏感信息
        var models = enabledModels.stream().map(m -> {
            Map<String, Object> modelMap = new HashMap<>();
            modelMap.put("id", m.getId());
            modelMap.put("name", m.getModelName());
            modelMap.put("tag", m.getTag());
            modelMap.put("provider", m.getProvider());
            modelMap.put("type", "model");
            return modelMap;
        }).toList();
        
        // 转换工作流数据
        var workflows = enabledWorkflows.stream().map(w -> {
            Map<String, Object> workflowMap = new HashMap<>();
            workflowMap.put("id", w.getId());
            workflowMap.put("name", w.getName());
            workflowMap.put("description", w.getDescription());
            workflowMap.put("type", "workflow");
            return workflowMap;
        }).toList();
        
        // 合并模型和工作流列表
        data.put("items", models);
        data.put("workflows", workflows);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }
}