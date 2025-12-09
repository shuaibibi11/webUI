package com.test;

import java.util.HashMap;
import java.util.Map;

import com.alibaba.fastjson.JSON;

/**
 * 测试类
 */
public class Test3DES {
	
	

	public static void main(String[] args) throws Exception {
		
		//ak
		String ak = "GLAE737HwePnpsfq";
		//sk
		String sk = "SNdoiELCia1UHTZW7itqhXPdjuLFXhc5";
		//产品编号
		String productCode = "BASE0049";
		
		
		//请求地址
		String url = "http://39.108.96.22:8899/bgapi/dataMark/check";
		
		// 当前时间戳，精确到毫秒。
		Long timestamp = System.currentTimeMillis();
		 // 计算：签名，MD5(ak + timestamp + MD5(sk))
		 String sign = MD5Util.MD5Encode(ak + timestamp  +MD5Util.MD5Encode(sk) );
		 
		 HashMap<String, Object> params = new HashMap<String, Object>();
		 params.put("ak", ak);
		 params.put("timestamp", timestamp);
		 params.put("sign", sign);
		 params.put("productCode",productCode);//产品编号
		 params.put("requestId", ""+timestamp);
		 params.put("requestType", "1");//1:明文/2:SM3/3:SHA256/4:MD5

		 //请求参数体
		 HashMap<String, Object> requestParams = new HashMap<String, Object>();
		 requestParams.put("mobile", Sm3Util.sm3WithBase64("15989014157"));//手机号码
		 requestParams.put("certNo", Sm3Util.sm3WithBase64("440982199103223677"));//身份证
		 requestParams.put("name", Sm3Util.sm3WithBase64("王庭飞"));//姓名
	     //参数加密
	     DesedeUtil enc = new DesedeUtil(DesedeUtil.ENCRYPT_MODE, sk);
	     //请求参数(进行加密)
		 params.put("request", enc.encrypt(JSON.toJSONString(requestParams)));
		 String  result = HttpUtil.doHttpPostJson(JSON.toJSONString(params), url);
		 System.out.println(result);
		 
		 
		 //返回报文进行解密
		 Map resultMap = JSON.parseObject(result, Map.class);
		 //返回的加密报文
		 String encryptStr = resultMap.get("data").toString();
		 //解密号码
		 enc = new DesedeUtil(DesedeUtil.DECRYPT_MODE, sk);
		 String data =  enc.decrypt(encryptStr);
		 System.out.println("解密:" + data);

		 
		 
		
	}

}
