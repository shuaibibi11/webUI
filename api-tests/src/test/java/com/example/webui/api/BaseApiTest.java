package com.example.webui.api;

import io.restassured.RestAssured;
import io.restassured.config.RestAssuredConfig;
import io.restassured.config.SSLConfig;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

public abstract class BaseApiTest {

    protected static RequestSpecification requestSpec;

    @BeforeAll
    public static void setupAll() {
        // 配置REST Assured
        RestAssured.config = RestAssuredConfig.config()
                .sslConfig(SSLConfig.sslConfig().relaxedHTTPSValidation());

        // 设置基础URL和端口
        RestAssured.baseURI = "http://localhost:13080";
        RestAssured.basePath = "/api";
        RestAssured.port = 13080;

        // 设置默认内容类型和接受类型
        requestSpec = RestAssured.given()
                .contentType(ContentType.JSON)
                .accept(ContentType.JSON)
                .header("User-Agent", "REST Assured/5.5.0");
    }

    @BeforeEach
    public void setup() {
        // 在每个测试前执行的设置
    }

    protected String readJsonFile(String filePath) throws IOException {
        File file = new File(filePath);
        return new String(Files.readAllBytes(file.toPath()));
    }

    protected Map<String, Object> getTestData(String key) {
        // 从测试数据文件中获取测试数据
        return Map.of();
    }
}
