package com.pixelcraftforge.controller;

import com.pixelcraftforge.config.OssProperties;
import com.pixelcraftforge.config.StorageProperties;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;

@RestController
@RequestMapping("/api/media")
public class MediaProxyController {

    private final OkHttpClient okHttpClient;
    private final StorageProperties storageProperties;
    private final OssProperties ossProperties;

    public MediaProxyController(
            OkHttpClient okHttpClient,
            StorageProperties storageProperties,
            OssProperties ossProperties) {
        this.okHttpClient = okHttpClient;
        this.storageProperties = storageProperties;
        this.ossProperties = ossProperties;
    }

    /**
     * 代理拉取 OSS 等跨域资源，供前端 fetch / canvas 使用（避免浏览器 CORS）。
     */
    @GetMapping("/proxy")
    public ResponseEntity<byte[]> proxy(@RequestParam("url") String url) throws IOException {
        if (!StringUtils.hasText(url)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url 不能为空");
        }
        String normalized = url.trim();
        validateAllowedUrl(normalized);

        Request request = new Request.Builder().url(normalized).get().build();
        try (Response response = okHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "拉取资源失败: " + (response.code()));
            }
            byte[] body = response.body().bytes();
            String contentType = response.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(body);
        }
    }

    private void validateAllowedUrl(String url) {
        URI uri;
        try {
            uri = URI.create(url);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url 格式不正确");
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()) && !"http".equalsIgnoreCase(uri.getScheme())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "仅支持 http(s) 资源");
        }

        if (storageProperties.isOssEnabled() && ossProperties.isConfigured()) {
            String base = ossProperties.getPublicBaseUrl().replaceAll("/$", "");
            if (url.startsWith(base)) {
                return;
            }
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "不允许代理该地址");
    }
}
