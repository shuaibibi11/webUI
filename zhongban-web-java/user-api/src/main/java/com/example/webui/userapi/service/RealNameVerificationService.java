package com.example.webui.userapi.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.example.webui.common.util.DES3Util;
import com.example.webui.common.util.SM3Util;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.codec.digest.DigestUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 实名认证服务
 * 调用风控API进行手机号、身份证、姓名三要素验证
 */
@Service
public class RealNameVerificationService {
    private static final Logger log = LoggerFactory.getLogger(RealNameVerificationService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${verification.api.url:http://39.105.171.251:28888/risk/dataMark}")
    private String apiUrl;

    @Value("${verification.api.secretId:147a7492185f4b05906b4e8d317de0eb}")
    private String secretId;

    @Value("${verification.api.secretKey:6d2478cf4b064eb7bc826882bea5225d}")
    private String secretKey;

    @Value("${verification.api.productCode:TE013001}")
    private String productCode;

    @Value("${verification.api.timeout:60000}")
    private int timeout;

    @Value("${verification.api.encodeType:md5}")
    private String encodeType;

    @Value("${verification.api.enabled:true}")
    private boolean enabled;

    /**
     * 验证结果
     */
    public static class VerificationResult {
        private Integer status;  // 1=匹配, 2=手机号与姓名不匹配, 3=手机号与证件号不匹配, 4=三者不匹配, -1=非移动用户, -2=数据异常
        private String message;
        private boolean success;

        public VerificationResult(Integer status, String message, boolean success) {
            this.status = status;
            this.message = message;
            this.success = success;
        }

        public Integer getStatus() { return status; }
        public String getMessage() { return message; }
        public boolean isSuccess() { return success; }

        public static String getStatusMessage(Integer status) {
            if (status == null) return "未验证";
            switch (status) {
                case 1: return "三要素匹配";
                case 2: return "手机号与姓名不匹配";
                case 3: return "手机号与证件号不匹配";
                case 4: return "三要素不匹配";
                case -1: return "非移动用户";
                case -2: return "数据异常";
                default: return "未知状态: " + status;
            }
        }
    }

    /**
     * 验证用户实名信息
     * @param mobile 手机号
     * @param idCard 身份证号
     * @param realName 真实姓名
     * @return 验证结果
     */
    public VerificationResult verify(String mobile, String idCard, String realName) {
        if (!enabled) {
            log.info("实名认证功能已禁用");
            return new VerificationResult(null, "实名认证功能已禁用", true);
        }

        try {
            log.info("========== 开始实名认证 ==========");
            log.info("配置信息: apiUrl={}, secretId={}, productCode={}, encodeType={}",
                    apiUrl, secretId, productCode, encodeType);
            log.info("原始数据(脱敏): mobile={}, idCard={}, name={}",
                    mobile.substring(0, 3) + "****" + mobile.substring(7),
                    idCard.substring(0, 6) + "********" + idCard.substring(14),
                    realName.substring(0, 1) + "**");
            // 打印完整原始数据以便调试
            log.info("原始数据(完整): mobile={}, idCard={}, name={}", mobile, idCard, realName);

            // 1. 构建请求参数
            String requestRefId = UUID.randomUUID().toString().replace("-", "");
            String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String authCode = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            log.info("请求ID: {}, 日期: {}, authCode: {}", requestRefId, date, authCode);

            // 2. 对原始数据进行MD5加密（32位小写）
            String mobileMd5 = encodeValue(mobile);
            String idCardMd5 = encodeValue(idCard);
            String nameMd5 = encodeValue(realName);

            log.info("======= MD5加密结果 =======");
            log.info("mobile原文: {} -> MD5: {} (长度:{})", mobile, mobileMd5, mobileMd5.length());
            log.info("certNo原文: {} -> MD5: {} (长度:{})", idCard, idCardMd5, idCardMd5.length());
            log.info("name原文: {} -> MD5: {} (长度:{})", realName, nameMd5, nameMd5.length());

            // 3. 构建请求体
            ObjectNode param = objectMapper.createObjectNode();
            param.put("mobile", mobileMd5);
            param.put("certNo", idCardMd5);
            param.put("name", nameMd5);
            param.put("date", date);
            param.put("authCode", authCode);

            ObjectNode req = objectMapper.createObjectNode();
            req.set("param", param);

            String reqJson = objectMapper.writeValueAsString(req);
            log.info("请求参数(MD5加密后): {}", reqJson);

            // 4. 3DES加密请求体
            String encryptedReq = DES3Util.encode(reqJson, secretKey);
            log.info("3DES加密后(前50字符): {}...", encryptedReq.substring(0, Math.min(50, encryptedReq.length())));

            // 5. 生成SM3签名
            String signData = String.format("requestRefId=%s&secretId=%s&secretKey=%s", requestRefId, secretId, secretKey);
            log.info("签名原文: {}", signData);
            String signature = SM3Util.doSM3Encryption(signData);
            log.info("SM3签名结果: {}", signature);

            // 6. 构建完整请求
            ObjectNode head = objectMapper.createObjectNode();
            head.put("productCode", productCode);
            head.put("requestRefId", requestRefId);
            head.put("secretId", secretId);
            head.put("signature", signature);

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.set("head", head);
            requestBody.put("request", encryptedReq);

            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.info("======= 发送请求 =======");
            log.info("请求URL: {}", apiUrl);
            log.info("请求头信息: productCode={}, requestRefId={}, secretId={}", productCode, requestRefId, secretId);

            // 7. 发送请求
            long startTime = System.currentTimeMillis();
            HttpResponse response = HttpRequest.post(apiUrl)
                    .body(requestJson)
                    .contentType("application/json")
                    .timeout(timeout)
                    .execute();

            String responseBody = response.body();
            long costTime = System.currentTimeMillis() - startTime;
            log.info("======= 收到响应 (耗时: {}ms) =======", costTime);
            log.info("HTTP状态码: {}", response.getStatus());
            log.info("响应内容: {}", responseBody);

            // 8. 解析响应
            JsonNode responseJson = objectMapper.readTree(responseBody);

            // 检查head中的responseCode（API使用responseCode而不是code）
            String respCode = responseJson.path("head").path("responseCode").asText("");
            String respMsg = responseJson.path("head").path("responseMsg").asText("");
            String result = responseJson.path("head").path("result").asText("");
            log.info("响应head: responseCode={}, responseMsg={}, result={}", respCode, respMsg, result);

            // 如果API在head中直接返回了结果（无需解密response）
            if (!respCode.isEmpty() && respCode.equals("1007")) {
                // 1007 = 非移动用户
                log.info("======= 验证结果（非移动用户）=======");
                return new VerificationResult(-1, respMsg, false);
            }

            String encryptedResponse = responseJson.path("response").asText(null);

            if (encryptedResponse != null && !encryptedResponse.isEmpty()) {
                // 解密响应
                log.info("加密响应(前50字符): {}...", encryptedResponse.substring(0, Math.min(50, encryptedResponse.length())));
                String decryptedResponse = DES3Util.decode(encryptedResponse, secretKey);
                log.info("解密后的响应: {}", decryptedResponse);

                JsonNode decryptedJson = objectMapper.readTree(decryptedResponse);

                // 尝试读取 status 字段，如果不存在则读取 KeyElemMatch 字段
                Integer status;
                if (decryptedJson.has("status")) {
                    status = decryptedJson.path("status").asInt();
                } else if (decryptedJson.has("KeyElemMatch")) {
                    // KeyElemMatch 的值: 1=匹配, 2=手机号与姓名不匹配, 3=手机号与证件号不匹配, 4=三者不匹配
                    String keyElemMatch = decryptedJson.path("KeyElemMatch").asText();
                    status = Integer.parseInt(keyElemMatch);
                    log.info("读取KeyElemMatch字段: {}", keyElemMatch);
                } else {
                    log.warn("响应中没有status或KeyElemMatch字段");
                    status = -2;
                }

                String message = VerificationResult.getStatusMessage(status);

                log.info("======= 验证结果 =======");
                log.info("status={}, message={}, success={}", status, message, status == 1);

                return new VerificationResult(status, message, status == 1);
            } else {
                // response为null，根据responseCode返回对应结果
                log.warn("======= 验证未返回加密数据 =======");
                log.warn("responseCode={}, responseMsg={}, result={}", respCode, respMsg, result);

                // 根据responseCode判断结果
                // 1007 = 非移动用户（已在前面处理）
                // 1001-1006 = 各种参数错误
                // 0000/2000 = 成功但无数据
                if (respCode.startsWith("100") || respCode.startsWith("200")) {
                    // 参数错误或API错误
                    return new VerificationResult(-2, "验证失败: " + respMsg, false);
                }

                // 其他情况根据result字段判断
                if ("Y".equalsIgnoreCase(result)) {
                    return new VerificationResult(1, "三要素匹配", true);
                } else if ("N".equalsIgnoreCase(result)) {
                    // 不匹配时根据responseMsg给出更详细的提示
                    if (respMsg.contains("非移动")) {
                        return new VerificationResult(-1, respMsg, false);
                    }
                    return new VerificationResult(4, respMsg.isEmpty() ? "三要素不匹配" : respMsg, false);
                }

                return new VerificationResult(-2, "验证失败: " + (respMsg.isEmpty() ? "未知错误" : respMsg), false);
            }

        } catch (Exception e) {
            log.error("======= 实名认证异常 =======");
            log.error("异常类型: {}", e.getClass().getName());
            log.error("异常信息: {}", e.getMessage());
            log.error("异常堆栈: ", e);
            return new VerificationResult(-2, "验证异常: " + e.getMessage(), false);
        }
    }

    /**
     * 对字段值进行编码（MD5/SHA256/SM3）
     */
    private String encodeValue(String value) {
        if (value == null) return null;

        switch (encodeType.toLowerCase()) {
            case "md5":
            case "m5":
                return DigestUtils.md5Hex(value);
            case "sha256":
                return DigestUtils.sha256Hex(value).toUpperCase();
            case "sm3":
                return SM3Util.digestBase64(value);
            default:
                return value;
        }
    }
}
