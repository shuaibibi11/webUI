package com.example.webui.adminapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {
    @GetMapping("/health")
    public Map<String,Object> health(){
        Map<String,Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("status", "ok");
        res.put("message", "服务运行正常");
        return res;
    }
}
