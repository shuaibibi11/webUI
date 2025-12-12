package com.example.webui.common.client;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@SuppressWarnings("null")
public class BishengClient {
    private final WebClient webClient;
    
    public BishengClient(String baseUrl, String apiKey) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }
    
    /**
     * 调用Bisheng工作流
     * @param workflowId 工作流ID
     * @param inputs 输入参数
     * @return SSE事件流
     */
    public Flux<ServerSentEvent<String>> invokeWorkflow(String workflowId, Map<String, Object> inputs) {
        Map<String, Object> requestBody = Map.of(
                "workflow_id", workflowId,
                "inputs", inputs
        );
        
        return webClient.post()
                .uri("/v2/workflow/invoke")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {});
    }
    
    /**
     * 停止Bisheng工作流
     * @param taskId 任务ID
     * @return 停止结果
     */
    public Mono<Map<String, Object>> stopWorkflow(String taskId) {
        Map<String, Object> requestBody = Map.of(
                "task_id", taskId
        );
        
        return webClient.post()
                .uri("/v2/workflow/stop")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }
}