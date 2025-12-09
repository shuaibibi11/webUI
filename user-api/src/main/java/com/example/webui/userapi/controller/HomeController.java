package com.example.webui.userapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HomeController {
    @GetMapping("")
    public Map<String, String> root() { 
        return Map.of("status", "ok", "message", "WebUI User API Service"); 
    }
}
