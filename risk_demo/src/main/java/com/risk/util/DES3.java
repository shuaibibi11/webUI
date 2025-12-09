package com.risk.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESedeKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;

public class DES3 {
    private static final Logger log = LogManager.getLogger(DES3.class);
    private static final String ALGORITHM = "DESede";
    private static final String ALGORITHMCipher = "DESede/ECB/PKCS5Padding";

    /**
     * 根据秘钥进行加密
     * @param strMing
     * @param secretKey 必要要求至少32位
     * @return
     */
    public static String encode(String strMing, String secretKey) {
        try {
            Key sKsecretKey = getKey(secretKey);
            Cipher cipher = Cipher.getInstance(ALGORITHMCipher);
            cipher.init(1, sKsecretKey);
            byte[] byteMi = cipher.doFinal(strMing.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(byteMi);
        } catch (Exception e) {
            e.printStackTrace();
            log.error(e.getMessage(),e);
            return strMing;
        }
    }

    /**
     * 根据秘钥进行解密
     * @param paramAfterEncrypt
     * @param secretKey
     * @return
     */
    public static String decode(String paramAfterEncrypt, String secretKey) {

        try {
            Key sKsecretKey = getKey(secretKey);
            Cipher cipher = Cipher.getInstance(ALGORITHMCipher);
            cipher.init(2, sKsecretKey);
            byte[] byteMing = cipher.doFinal(Base64.getDecoder().decode(paramAfterEncrypt));
            return new String(byteMing, StandardCharsets.UTF_8);
        } catch (Exception e) {
            e.printStackTrace();
            log.error(e.getMessage(),e);
            return paramAfterEncrypt;
        }
    }

    private static Key getKey(String secretKey) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(secretKey);
        DESedeKeySpec dks = new DESedeKeySpec(keyBytes);
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(ALGORITHM);
        return keyFactory.generateSecret(dks);
    }

    public static void main(String[] args) {


        String secretKey = "080f5d0b59314a0aa1060dd96751d111";

        String val = "15087705664";
        System.out.println(encode(val,secretKey));

        System.out.println(decode(encode(val,secretKey),secretKey));

        String req = "8f3e99fdf67b50ba98e44fef8dc265fb1854cc8658eba98ea56e7ff5c190853d09651f5e4dd3c568ca6763c55f19a8b6fab2a76ebe79c8801d985677bd7c14c0562471d2e3ba5f2cc066592542c5da0e3aa821604e1f5778af655105fcd23d0ea0d79313112e5d014212e8255d210f7e";
        String key = "oswKt2WH4n/L260rDLPWtm0A2/eLWVpWUf5fKORwhVE=";
        System.out.println(decode(req,key));
    }
}
