package com.pixelcraftforge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pixelcraftforge.config.SeedreamProperties;
import com.pixelcraftforge.dto.SeedreamApiRequest;
import com.pixelcraftforge.dto.SeedreamApiResponse;
import com.pixelcraftforge.exception.SeedreamApiException;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class SeedreamClient {

    private static final Logger log = LoggerFactory.getLogger(SeedreamClient.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final long MIN_PIXELS = 3_686_400L;

    private final OkHttpClient okHttpClient;
    private final ObjectMapper objectMapper;
    private final SeedreamProperties seedreamProperties;

    public SeedreamClient(OkHttpClient okHttpClient, ObjectMapper objectMapper, SeedreamProperties seedreamProperties) {
        this.okHttpClient = okHttpClient;
        this.objectMapper = objectMapper;
        this.seedreamProperties = seedreamProperties;
    }

    public String generateTextToImage(String prompt, int width, int height) {
        return generate(prompt, width, height, null);
    }

    public String generateImageToImage(String prompt, int width, int height, String referenceImageDataUri) {
        return generate(prompt, width, height, referenceImageDataUri);
    }

    private String generate(String prompt, int width, int height, String referenceImageDataUri) {
        String apiKey = seedreamProperties.getApi().getKey();
        if (apiKey == null || apiKey.isBlank() || "your-api-key-placeholder".equals(apiKey)) {
            throw new SeedreamApiException("Seedream API Key 未配置，请设置环境变量 SEEDREAM_API_KEY");
        }

        String size = resolveSize(width, height);
        SeedreamApiRequest apiRequest = new SeedreamApiRequest(
                seedreamProperties.getModel().getId(),
                prompt,
                size
        );
        if (referenceImageDataUri != null) {
            apiRequest.setImage(referenceImageDataUri);
        }

        try {
            String requestJson = objectMapper.writeValueAsString(apiRequest);
            Request request = new Request.Builder()
                    .url(seedreamProperties.getApi().getUrl())
                    .header("Authorization", "Bearer " + apiKey)
                    .post(RequestBody.create(requestJson, JSON))
                    .build();

            String mode = referenceImageDataUri == null ? "文生图" : "图生图";
            log.info("调用 Seedream API {}, model={}, prompt={}, size={}",
                    mode, seedreamProperties.getModel().getId(), prompt, size);

            try (Response response = okHttpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("Seedream API 请求失败, status={}, body={}", response.code(), responseBody);
                    throw new SeedreamApiException("Seedream API 请求失败: HTTP " + response.code());
                }

                SeedreamApiResponse apiResponse = objectMapper.readValue(responseBody, SeedreamApiResponse.class);
                if (apiResponse.getError() != null && apiResponse.getError().getMessage() != null) {
                    throw new SeedreamApiException("Seedream API 返回错误: " + apiResponse.getError().getMessage());
                }
                if (apiResponse.getData() == null || apiResponse.getData().isEmpty()) {
                    throw new SeedreamApiException("Seedream API 未返回图片数据");
                }

                String imageUrl = apiResponse.getData().get(0).getUrl();
                if (imageUrl == null || imageUrl.isBlank()) {
                    throw new SeedreamApiException("Seedream API 返回的图片 URL 为空");
                }

                log.info("Seedream API 生成成功, imageUrl={}", imageUrl);
                return imageUrl;
            }
        } catch (IOException ex) {
            log.error("调用 Seedream API 时发生 IO 异常", ex);
            throw new SeedreamApiException("调用 Seedream API 失败: " + ex.getMessage());
        }
    }

    private String resolveSize(int width, int height) {
        long pixels = (long) width * height;
        if (pixels >= MIN_PIXELS) {
            return width + "x" + height;
        }

        double scale = Math.sqrt((double) MIN_PIXELS / pixels);
        int scaledWidth = (int) Math.ceil(width * scale);
        int scaledHeight = (int) Math.ceil(height * scale);
        log.info("Seedream 5.0 最小像素为 {}，已将 {}x{} 提升至 {}x{}",
                MIN_PIXELS, width, height, scaledWidth, scaledHeight);
        return scaledWidth + "x" + scaledHeight;
    }
}
