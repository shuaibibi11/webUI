package com.test;

import java.util.List;

/**
 * 工具类
 */
public class StringTools {

    
    /**
     * 验证一个字符串或者数组不为空
     *
     * @param obj
     * @return
     */
    public static boolean isNotempty(Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj instanceof List) {
            List list = (List) obj;
            return !list.isEmpty();
        } else {
            return obj.toString().trim().length() > 0;
        }
    }
    
    
}