package com.risk.util;
import cn.hutool.crypto.digest.SM3;
import java.util.Base64;

public class SM3Util {

    /**
     * SM3 哈希值
     * 标准算法是转换成64位16进制字符串，算法类比 SHA256
     *
     * @param message
     * @return
     */
    public static String digestHex(String message) {
        return SM3.create().digestHex(message);
    }

    /**
     * SM3 哈希值 --> Base64 编码
     * 使用的SM3算法，转换为BASE64字符串
     *
     * @param message
     * @return
     */
    public static String digestBase64(String message) {
        return Base64.getEncoder().encodeToString(SM3.create().digest(message));
    }


    /**
     *
     * SM3 哈希值-->十六进制字符串--> Base64 编码
     *
     * 先计算其 SM3 哈希值，将哈希值转换为十六进制字符串，
     * 再将十六进制字符串转换为 Base64 编码字符串，
     * 返回最终的 Base64 编码字符串
     *
     * @param message
     * @return
     */
    public static String doSM3Encryption(String message) {
        String hexHash = SM3.create().digestHex(message);
        byte[] bytes = hexHash.getBytes();
        return Base64.getEncoder().encodeToString(bytes);
    }

    public static void main(String[] args) {

        String message = "Hello, World!";

        String hutoolHash = doSM3Encryption(message);
        System.out.println("Hutool SM3 Hash: " + hutoolHash);


        System.out.println(digestBase64("123456"));
    }
}
