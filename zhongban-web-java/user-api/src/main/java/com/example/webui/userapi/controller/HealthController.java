package com.example.webui.userapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {
    @GetMapping("/health")
    public Map<String,String> health(){
        return Map.of("status","ok","message","服务运行正常");
    }
}
