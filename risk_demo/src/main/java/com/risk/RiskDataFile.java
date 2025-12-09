package com.risk;

import cn.hutool.crypto.digest.DigestUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.setting.dialect.Props;
import com.alibaba.fastjson.JSONObject;
import com.risk.util.DES3;
import com.risk.util.SM3Util;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.io.FileOutputStream;
import java.util.UUID;
import java.util.zip.GZIPOutputStream;

/**
 *
 * @author xzh
 * @desc 风控数据文件调用测试样例
 */
public class RiskDataFile {
    private static final Logger log = LogManager.getLogger(RiskDataFile.class);

    // 加载配置文件
    private static final Props props = new Props("config2.properties");
    /**接口地址*/
    private static final String URL = props.getStr("dataFileUrl");
    /**配置超时时间*/
    private static final int TIMEOUT = props.getInt("timeout");
    /**加密类型*/
    private static final String ENCODE_TYPE = "";
    /**批次*/
    private static final String BATCH = props.getStr("batch");
    /**文件名时间*/
    private static final String FILE_TIME = props.getStr("fileTime");

    private static  String DATA_FILE_PATH = props.getStr("dataFilePath");

    /** secretId 账号 */
    private static final String SECRET_ID = props.getStr("secretId");

    private static final String SECRET_KEY = props.getStr("secretKey");


    /**产品编码*/
    private static final String PRODUCT_CODE = props.getStr("dataFileProductCode");

    public static void main(String[] args) {
        encodeAndSendPost(PRODUCT_CODE, SECRET_ID, SECRET_KEY);
    }

    /**
     * 对数据文件 产品 进行加密后发送post请求
     * @param productCode
     * @param secretId
     * @param secretKey
     */
    public static void encodeAndSendPost(String productCode, String secretId, String secretKey) {
        String req = getReqJsonObj(BATCH, FILE_TIME,ENCODE_TYPE);
        String requestRefId = UUID.randomUUID().toString().replace("-", "");
        String sm3Signature = generateSm3Signature(requestRefId, secretId, secretKey);
        log.info("SM3 Signature: {}", sm3Signature);

        log.info("Request: {}", req);
        String encryptedReq = DES3.encode(req, secretKey);

        JSONObject json = createRequestJson(productCode, requestRefId, secretId, sm3Signature, encryptedReq);
        log.info(json.toJSONString());


        sendPost(URL, json.toJSONString(), TIMEOUT);

    }

    /**
     * 生成鉴权信息
     * @param requestRefId
     * @param secretId
     * @param secretKey
     * @return
     */
    public static String generateSm3Signature(String requestRefId, String secretId, String secretKey) {
        String data = String.format("requestRefId=%s&secretId=%s&secretKey=%s", requestRefId, secretId, secretKey);
        String sm3Signature = SM3Util.doSM3Encryption(data);
        log.info("Generated SM3 Signature: {}", sm3Signature);

        return sm3Signature;
    }

    /**
     * 生成完整的请求参数
     * @param productCode
     * @param requestRefId
     * @param secretId
     * @param signature
     * @param encryptedReq
     * @return
     */
    public static JSONObject createRequestJson(String productCode, String requestRefId, String secretId, String signature, String encryptedReq) {
        JSONObject head = new JSONObject();
        head.put("productCode", productCode);
        head.put("requestRefId", requestRefId);
        head.put("secretId", secretId);
        head.put("signature", signature);

        JSONObject json = new JSONObject();
        json.put("head", head);
        json.put("request", encryptedReq);

        return json;
    }


    /**
     * 生成 req 参数
     * @param batch
     * @param fileTime
     * @param encodeStr
     * @return
     */
    public static String getReqJsonObj(String batch, String fileTime,String encodeStr) {
        JSONObject param = new JSONObject();

        putEncodedValue(param, "batch", batch, encodeStr);
        putEncodedValue(param, "fileTime", fileTime, encodeStr);

        JSONObject req = new JSONObject();
        req.put("param", param);
        log.info(req.toJSONString());
        return req.toJSONString();
    }

    /**
     * 进行字段加密
     * @param param
     * @param key
     * @param value
     * @param encodeStr
     */
    public static void putEncodedValue(JSONObject param, String key, String value, String encodeStr) {
        if (value != null) {
            switch (encodeStr) {
                case "sha256":
                    param.put(key, DigestUtil.sha256Hex(value));
                    break;
                case "md5":
                    param.put(key, DigestUtils.md5Hex(value));
                    break;
                case "sm3":
                    param.put(key, SM3Util.digestBase64(value));
                    break;
                default:
                    param.put(key, value);
                    break;
            }
        }
    }

    /**
     * 发送post 请求,获取文件流,将 gz 文件保留到 本地
     *
     * @param url
     * @param body
     * @param timeout
     */
    private static void sendPost(String url, String body, int timeout) {
        log.info("请求地址: {}", url);
        Long startTime = System.currentTimeMillis();
        HttpResponse response = HttpRequest.post(url)
                .body(body)
                .timeout(timeout)
                .execute();

        // 获取响应的字节数组
        byte[] resultBytes = response.bodyBytes();
        log.info("耗时： {} 毫秒", System.currentTimeMillis() - startTime);
        log.info("path: " + DATA_FILE_PATH);
      try (FileOutputStream fos = new FileOutputStream(DATA_FILE_PATH);
           GZIPOutputStream gos = new GZIPOutputStream(fos)) {
           gos.write(resultBytes);
        } catch (Exception e) {
            String errorMsg = new String(resultBytes);
            log.error("处理响应时出错: {}, 响应内容: {}", e.getMessage(), errorMsg, e);

        }
        curlFormatStr(url, body);
    }

    private static void curlFormatStr(String url, String body) {
        String curlStr = String.format("curl -X POST '%s' -H 'Content-Type: application/json' -d '%s'", url, body);
        log.info("curl 命令可以复制到 linux 命令行执行: \n{}", curlStr);
    }

}