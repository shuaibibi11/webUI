package com.example.webui.userapi.service;

import com.example.webui.userapi.model.Model;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ModelService {

    public List<Model> getAllModels() {
        List<Model> models = new ArrayList<>();
        
        // 默认模型
        models.add(new Model("default", "和元智擎-Chat", "默认通用对话模型", "和元智擎", true));
        
        // 可以添加更多模型
        models.add(new Model("gpt-3.5-turbo", "GPT-3.5 Turbo", "OpenAI GPT-3.5 Turbo 模型", "OpenAI", true));
        models.add(new Model("gpt-4", "GPT-4", "OpenAI GPT-4 模型", "OpenAI", true));
        models.add(new Model("claude-3", "Claude 3", "Anthropic Claude 3 模型", "Anthropic", true));
        
        return models;
    }
}