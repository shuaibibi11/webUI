package com.risk;

/**
 * @author xzh
 * @version 1.0
 * @description: TODO
 * @create 2024/11/4 14:59
 */

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;


/**
 * 模拟断点续传-下载功能 ： 下载---》中断--》继续下载剩余的文件  -----》生成下载所需文件
 * @author xzh
 */

public class RangeDownloadWithInterruption {
    private static final Logger log = LogManager.getLogger(RangeDownloadWithInterruption.class);
    private static final String FILE_URL = "http://localhost:9002/risk/dataFile";
    private static final String SAVE_FILE_PATH = "D:\\downloaded_file.gz";
    /** 5MB */
    private static final long INTERRUPTION_POINT = 1024 * 1024 * 5;

    /** 准备JSON请求体 */
    private static final String JSON_STR = "{\"head\":{\"productCode\":\"TE013088\",\"signature\":\"NjkwNGY1MGVlZmNlNDYxODRiZGFmZmUyMzQzMDRlYmRiZjI4MGI0OTdlMzE5ZWYyZjZjYTVmZDVjZDliNzhmOA==\",\"secretId\":\"111set_your_secretId222\",\"requestRefId\":\"e289021be6934785b61e6e8421372310\"},\"request\":\"zL0L/7eDp4Y34AMRTzqqwNKUu56cMbZ0I2JVdj4IbBzAsMaDQrfqM0uBIE4GdyuJJx5JKmJhJ2TDwgiJvKm5ZXdqMYMOmdEirjkqP3JItbZKMchRPM7Ts7glh0I1oIJzkvq83XwUd3ILiC6k11suJA==\"}";

    public static void main(String[] args) {
            //downloadAll();
            rangeDownload();
    }

    /**
     * 完整下载
     */
    private static void downloadAll() {
        try {
            downloadPart(0,false);
        } catch (Exception e) {
            log.error("Error during download: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 模拟断点续传下载
     */
    private static void rangeDownload() {
        try {
            // 第一步：尝试下载文件的前一部分
            long downloadedBytes = downloadPart(0, true);

            // 假设下载被中断，此时我们已经知道下载了多少字节
            log.info("Downloaded bytes before interruption: " + downloadedBytes);
            Thread.sleep(30*1000);

            // 第二步：从上次中断处继续下载剩余部分
            downloadPart(downloadedBytes,false);
        } catch (Exception e) {
            log.error("Error during download: " + e.getMessage());

            e.printStackTrace();
        }
    }



    private static long downloadPart(long startByte,Boolean isInterrup) throws Exception {
        RandomAccessFile savedFile = new RandomAccessFile(SAVE_FILE_PATH, "rw");
        if (startByte > 0) {
            savedFile.seek(startByte);
        }

        URL url = new URL(FILE_URL);
        HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();

        // 设置请求方法为POST
        httpConn.setRequestMethod("POST");
        httpConn.setRequestProperty("Content-Type", "application/json; utf-8");
        httpConn.setRequestProperty("Accept", "application/json");
        httpConn.setDoOutput(true);

        // 设置 Range 头以请求从特定字节开始的数据, 例如 "bytes=0-"
        String rangeValue = "bytes=" + startByte + "-";
        httpConn.setRequestProperty("Range", rangeValue);



        // 发送请求体
        try (OutputStream os = httpConn.getOutputStream()) {
            byte[] input = JSON_STR.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int responseCode = httpConn.getResponseCode();
        if (responseCode == HttpURLConnection.HTTP_PARTIAL || responseCode == HttpURLConnection.HTTP_OK) {
            InputStream inputStream = httpConn.getInputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            long totalBytesRead = startByte;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                savedFile.write(buffer, 0, bytesRead);
                totalBytesRead += bytesRead;

                // 模拟在1MB时中断下载
                if (totalBytesRead >= INTERRUPTION_POINT && isInterrup) {
                    log.info("Simulating interruption at 1MB.");
                    break;
                }
            }

            inputStream.close();
            return totalBytesRead;
        } else {
            log.info("Server does not support HTTP Range requests. Response code: " + responseCode);
            return startByte;
        }
    }
}
