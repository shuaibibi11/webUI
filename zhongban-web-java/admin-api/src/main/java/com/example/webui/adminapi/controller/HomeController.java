package com.example.webui.adminapi.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("")
    public String root() { return "forward:/index.html"; }
    @GetMapping("/")
    public String home() { return "forward:/index.html"; }
}
