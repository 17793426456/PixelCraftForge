package com.pixelcraftforge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pixelcraftforge.config.SeedanceProperties;
import com.pixelcraftforge.dto.SeedanceCreateTaskRequest;
import com.pixelcraftforge.dto.SeedanceTaskResponse;
import com.pixelcraftforge.dto.VideoGenerateRequest;
import com.pixelcraftforge.exception.SeedanceApiException;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class SeedanceClient {

    private static final Logger log = LoggerFactory.getLogger(SeedanceClient.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient okHttpClient;
    private final ObjectMapper objectMapper;
    private final SeedanceProperties seedanceProperties;

    public SeedanceClient(
            @Qualifier("videoOkHttpClient") OkHttpClient okHttpClient,
            ObjectMapper objectMapper,
            SeedanceProperties seedanceProperties) {
        this.okHttpClient = okHttpClient;
        this.objectMapper = objectMapper;
        this.seedanceProperties = seedanceProperties;
    }

    public String createTextToVideoTask(VideoGenerateRequest request) {
        List<SeedanceCreateTaskRequest.ContentItem> content = List.of(
                SeedanceCreateTaskRequest.ContentItem.text(request.getPrompt())
        );
        return createTask(request, content);
    }

    public String createImageToVideoTask(VideoGenerateRequest request, String referenceImageDataUri) {
        List<SeedanceCreateTaskRequest.ContentItem> content = new ArrayList<>();
        content.add(SeedanceCreateTaskRequest.ContentItem.text(request.getPrompt()));
        content.add(SeedanceCreateTaskRequest.ContentItem.imageUrl(referenceImageDataUri));
        return createTask(request, content);
    }

    public SeedanceTaskResponse getTask(String taskId) {
        validateApiKey();

        Request request = new Request.Builder()
                .url(seedanceProperties.getApi().getTasksUrl() + "/" + taskId)
                .header("Authorization", "Bearer " + seedanceProperties.getApi().getKey())
                .get()
                .build();

        try (Response response = okHttpClient.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                log.error("Seedance 查询任务失败, taskId={}, status={}, body={}", taskId, response.code(), responseBody);
                throw new SeedanceApiException("Seedance 查询任务失败: HTTP " + response.code());
            }
            return objectMapper.readValue(responseBody, SeedanceTaskResponse.class);
        } catch (IOException ex) {
            log.error("Seedance 查询任务 IO 异常, taskId={}", taskId, ex);
            throw new SeedanceApiException("Seedance 查询任务失败: " + ex.getMessage());
        }
    }

    private String createTask(VideoGenerateRequest request, List<SeedanceCreateTaskRequest.ContentItem> content) {
        validateApiKey();

        SeedanceCreateTaskRequest apiRequest = new SeedanceCreateTaskRequest();
        apiRequest.setModel(seedanceProperties.getModel().getId());
        apiRequest.setContent(content);
        apiRequest.setRatio(request.getRatio());
        apiRequest.setDuration(request.getDuration());
        apiRequest.setResolution(request.getResolution());
        apiRequest.setGenerateAudio(resolveGenerateAudio(request.getGenerateAudio()));
        apiRequest.setWatermark(Boolean.TRUE.equals(request.getWatermark()));

        try {
            String requestJson = objectMapper.writeValueAsString(apiRequest);
            Request httpRequest = new Request.Builder()
                    .url(seedanceProperties.getApi().getTasksUrl())
                    .header("Authorization", "Bearer " + seedanceProperties.getApi().getKey())
                    .post(RequestBody.create(requestJson, JSON))
                    .build();

            log.info("创建 Seedance 视频任务, model={}, prompt={}, ratio={}, duration={}s, generateAudio={}",
                    seedanceProperties.getModel().getId(), request.getPrompt(),
                    request.getRatio(), request.getDuration(), apiRequest.isGenerateAudio());

            try (Response response = okHttpClient.newCall(httpRequest).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("Seedance 创建任务失败, status={}, body={}", response.code(), responseBody);
                    throw new SeedanceApiException("Seedance 创建任务失败: HTTP " + response.code());
                }

                SeedanceTaskResponse taskResponse = objectMapper.readValue(responseBody, SeedanceTaskResponse.class);
                if (taskResponse.getId() == null || taskResponse.getId().isBlank()) {
                    throw new SeedanceApiException("Seedance 未返回任务 ID");
                }

                log.info("Seedance 任务已创建, taskId={}", taskResponse.getId());
                return taskResponse.getId();
            }
        } catch (IOException ex) {
            log.error("Seedance 创建任务 IO 异常", ex);
            throw new SeedanceApiException("Seedance 创建任务失败: " + ex.getMessage());
        }
    }

    private void validateApiKey() {
        String apiKey = seedanceProperties.getApi().getKey();
        if (apiKey == null || apiKey.isBlank() || "your-api-key-placeholder".equals(apiKey)) {
            throw new SeedanceApiException("Seedance API Key 未配置，请设置环境变量 SEEDREAM_API_KEY");
        }
    }

    private boolean resolveGenerateAudio(Boolean generateAudio) {
        if (generateAudio != null) {
            return generateAudio;
        }
        return seedanceProperties.isGenerateAudio();
    }
}
