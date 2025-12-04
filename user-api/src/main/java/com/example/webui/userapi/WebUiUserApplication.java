package com.example.webui.userapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication(scanBasePackages = {"com.example.webui.common", "com.example.webui.userapi", "com.example.webui.userapi.controller"})
@EnableJpaRepositories(basePackages = "com.example.webui.common.repo")
@EntityScan(basePackages = "com.example.webui.common.entity")
public class WebUiUserApplication {
    public static void main(String[] args) {
        SpringApplication.run(WebUiUserApplication.class, args);
    }
}
