package com.example.webui.common.util;

import cn.hutool.crypto.digest.SM3;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.security.Security;
import java.util.Base64;

/**
 * SM3 哈希工具类
 */
public class SM3Util {

    // 静态初始化块：注册 BouncyCastle 提供者
    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    /**
     * SM3 哈希值 (64位16进制字符串)
     * @param message 消息
     * @return 16进制哈希值
     */
    public static String digestHex(String message) {
        return SM3.create().digestHex(message);
    }

    /**
     * SM3 哈希值 -> Base64 编码
     * @param message 消息
     * @return Base64编码的哈希值
     */
    public static String digestBase64(String message) {
        return Base64.getEncoder().encodeToString(SM3.create().digest(message));
    }

    /**
     * SM3 哈希值 -> 十六进制字符串 -> Base64 编码
     * 用于生成签名
     * @param message 消息
     * @return Base64编码的十六进制哈希值
     */
    public static String doSM3Encryption(String message) {
        String hexHash = SM3.create().digestHex(message);
        byte[] bytes = hexHash.getBytes();
        return Base64.getEncoder().encodeToString(bytes);
    }
}
