package com.risk;
import cn.hutool.crypto.digest.DigestUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.setting.dialect.Props;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.risk.util.DES3;
import com.risk.util.SM3Util;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.util.UUID;

/**
 *
 * @author xzh
 * @desc 风控调用测试样例
 */
public class RiskTest {
    private static final Logger log = LogManager.getLogger(RiskTest.class);

    // 加载配置文件
    private static final Props props = new Props("config.properties");
    /**接口地址*/
    private static final String URL = props.getStr("url");
    /**配置超时时间*/
    private static final int TIMEOUT = props.getInt("timeout");
    /**加密类型*/
    private static final String ENCODE_TYPE = props.getStr("encodeType");

    /** secretId 账号 */
    private static final String SECRET_ID = props.getStr("secretId");

    private static final String SECRET_KEY = props.getStr("secretKey");

    /**手机号*/
    private static final String MOBILE = props.getStr("mobile");

    /**身份证*/
    private static final String CERNO = props.getStr("cerno");

    /**姓名*/
    private static final String NAME = props.getStr("name");



    /**产品编码*/
    private static final String PRODUCT_CODE = props.getStr("productCode");

    public static void main(String[] args) {
        log.info(DigestUtil.sha256Hex("王庭飞").toUpperCase());
        encodeAndSendPost(PRODUCT_CODE, SECRET_ID, SECRET_KEY);
    }

    /**
     * 对三要素进行加密后发送post请求
     * @param productCode
     * @param secretId
     * @param secretKey
     */
    public static void encodeAndSendPost(String productCode, String secretId, String secretKey) {

        String req = getReqJsonObj(MOBILE, CERNO, NAME, "20240506", ENCODE_TYPE);
        String requestRefId = UUID.randomUUID().toString().replace("-", "");
        String sm3Signature = generateSm3Signature(requestRefId, secretId, secretKey);
        log.info("SM3 Signature: {}", sm3Signature);

        log.info("Request: {}", req);
        String encryptedReq = DES3.encode(req, secretKey);

        JSONObject json = createRequestJson(productCode, requestRefId, secretId, sm3Signature, encryptedReq);
        log.info(json.toJSONString());

        try {
           sendPost(URL, json.toJSONString(), TIMEOUT);
        } catch (Exception e) {
            log.error("Error sending POST request", e);
        }
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
     * @param mobile
     * @param certNo
     * @param name
     * @param dateStr
     * @param encodeStr
     * @return
     */
    public static String getReqJsonObj(String mobile, String certNo, String name, String dateStr, String encodeStr) {
        JSONObject param = new JSONObject();

        putEncodedValue(param, "mobile", mobile, encodeStr);
        putEncodedValue(param, "certNo", certNo, encodeStr);
        putEncodedValue(param, "name", name, encodeStr);

        param.put("date", dateStr);
        param.put("authCode", UUID.randomUUID().toString().replace("-", "").substring(0, 16));

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
                    param.put(key, DigestUtil.sha256Hex(value).toUpperCase());
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
     * 发送post 请求
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
        String result = response.body();
        log.info("耗时： {} 毫秒, 返回结果: {} " ,System.currentTimeMillis() - startTime, result);

        String resp = JSON.parseObject(result).getString("response");
        if(null!=resp) {
            log.info("返回信息解密结果: {}", DES3.decode(resp, SECRET_KEY));
        }
    }

}