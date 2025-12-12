package com.example.webui.common.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESedeKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;

/**
 * 3DES 加密解密工具类
 */
public class DES3Util {
    private static final Logger log = LoggerFactory.getLogger(DES3Util.class);
    private static final String ALGORITHM = "DESede";
    private static final String ALGORITHM_CIPHER = "DESede/ECB/PKCS5Padding";

    /**
     * 3DES 加密
     * @param plainText 明文
     * @param secretKey 密钥 (Base64编码)
     * @return Base64编码的密文
     */
    public static String encode(String plainText, String secretKey) {
        try {
            Key key = getKey(secretKey);
            Cipher cipher = Cipher.getInstance(ALGORITHM_CIPHER);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("3DES加密失败: {}", e.getMessage(), e);
            return plainText;
        }
    }

    /**
     * 3DES 解密
     * @param cipherText Base64编码的密文
     * @param secretKey 密钥 (Base64编码)
     * @return 明文
     */
    public static String decode(String cipherText, String secretKey) {
        try {
            Key key = getKey(secretKey);
            Cipher cipher = Cipher.getInstance(ALGORITHM_CIPHER);
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(cipherText));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("3DES解密失败: {}", e.getMessage(), e);
            return cipherText;
        }
    }

    private static Key getKey(String secretKey) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(secretKey);
        DESedeKeySpec dks = new DESedeKeySpec(keyBytes);
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(ALGORITHM);
        return keyFactory.generateSecret(dks);
    }
}
