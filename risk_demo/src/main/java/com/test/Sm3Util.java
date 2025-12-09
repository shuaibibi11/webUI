package com.test;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

import com.risk.util.SM3Util;
import org.bouncycastle.crypto.digests.SM3Digest;

import org.bouncycastle.pqc.math.linearalgebra.ByteUtils;
import org.bouncycastle.util.encoders.Base64;

public class Sm3Util {
	
	 /**
     * sm3加密后Base64编码
     * @param input
     * @return
     */
    public static String sm3WithBase64(String input) {
        // 创建 SM3 摘要实例
        SM3Digest sm3 = new SM3Digest();
        // 将输入字符串转换为字节数组
        byte[] inputBytes = input.getBytes(StandardCharsets.UTF_8);
        // 更新摘要
        sm3.update(inputBytes, 0, inputBytes.length);
        // 创建用于存储摘要结果的字节数组
        byte[] digest = new byte[sm3.getDigestSize()];
        // 完成摘要计算
        sm3.doFinal(digest, 0);
        // 对摘要结果进行 Base64 编码
        return new String(Base64.encode(digest), StandardCharsets.UTF_8);
    }
    
    
    /**
     * SM3加密
     * @param content  要加密的内容
     */
    public static String  Sm3EncryptText(String content) throws UnsupportedEncodingException {
        byte[] bytes = content.getBytes();
        byte[] hash = hash(bytes);
        String sm3 = ByteUtils.toHexString(hash);
        return sm3;
    }

    public static byte[] hash(byte[] srcData){
        SM3Digest digest=new SM3Digest();
        digest.update(srcData,0,srcData.length);
        byte[] bytes = new byte[digest.getDigestSize()];
        digest.doFinal(bytes,0);
        return bytes;
    }

    public static void main(String[] args) throws Exception {

    	String content = "张三";

    	System.out.println(Sm3EncryptText(content));
        System.out.println(sm3WithBase64(content));
        System.out.println(SM3Util.digestBase64(content));
    }

}
