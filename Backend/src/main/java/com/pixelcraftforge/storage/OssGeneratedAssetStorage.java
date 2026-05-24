package com.pixelcraftforge.storage;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import com.pixelcraftforge.config.OssProperties;
import com.pixelcraftforge.exception.ApiException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "oss")
public class OssGeneratedAssetStorage implements GeneratedAssetStorage {

    private static final Logger log = LoggerFactory.getLogger(OssGeneratedAssetStorage.class);

    private final OkHttpClient okHttpClient;
    private final OssProperties ossProperties;
    private OSS ossClient;

    public OssGeneratedAssetStorage(OkHttpClient okHttpClient, OssProperties ossProperties) {
        this.okHttpClient = okHttpClient;
        this.ossProperties = ossProperties;
    }

    @PostConstruct
    void init() {
        if (!ossProperties.isConfigured()) {
            throw new IllegalStateException("OSS 未配置完整，请设置 endpoint、bucket、accessKey 与 publicBaseUrl");
        }
        ossClient = new OSSClientBuilder().build(
                ossProperties.getEndpoint(),
                ossProperties.getAccessKeyId(),
                ossProperties.getAccessKeySecret()
        );
        log.info("阿里云 OSS 存储已启用, bucket={}, endpoint={}",
                ossProperties.getBucket(), ossProperties.getEndpoint());
    }

    @PreDestroy
    void shutdown() {
        if (ossClient != null) {
            ossClient.shutdown();
        }
    }

    @Override
    public String storeFromRemoteUrl(String remoteUrl, StorageCategory category) {
        Request request = new Request.Builder().url(remoteUrl).get().build();
        try (Response response = okHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY.value(),
                        "下载远程资源失败: HTTP " + response.code());
            }
            String fileName = UUID.randomUUID() + category.getDefaultExtension();
            return storeBytes(response.body().bytes(), fileName, category.getDefaultContentType(), category);
        } catch (IOException ex) {
            log.error("下载远程资源失败, url={}", remoteUrl, ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "下载远程资源失败: " + ex.getMessage());
        }
    }

    @Override
    public String storeBytes(byte[] bytes, String fileName, String contentType, StorageCategory category) {
        String objectKey = category.getFolder() + "/" + fileName;
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(bytes.length);
        metadata.setContentType(contentType);

        try {
            ossClient.putObject(
                    ossProperties.getBucket(),
                    objectKey,
                    new ByteArrayInputStream(bytes),
                    metadata
            );
            String publicUrl = buildPublicUrl(objectKey);
            log.info("OSS 上传完成, bucket={}, key={}, url={}", ossProperties.getBucket(), objectKey, publicUrl);
            return publicUrl;
        } catch (Exception ex) {
            log.error("OSS 上传失败, key={}", objectKey, ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "OSS 上传失败: " + ex.getMessage());
        }
    }

    private String buildPublicUrl(String objectKey) {
        String baseUrl = ossProperties.getPublicBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/" + objectKey;
    }
}
