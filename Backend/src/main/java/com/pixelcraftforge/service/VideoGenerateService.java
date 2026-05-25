package com.pixelcraftforge.service;

import com.pixelcraftforge.dto.SeedanceTaskResponse;
import com.pixelcraftforge.dto.VideoGenerateRequest;
import com.pixelcraftforge.dto.VideoTaskCreateResponse;
import com.pixelcraftforge.dto.VideoTaskResponse;
import com.pixelcraftforge.entity.AssetGenerationType;
import com.pixelcraftforge.exception.SeedanceApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VideoGenerateService {

    private static final Logger log = LoggerFactory.getLogger(VideoGenerateService.class);
    private static final String STATUS_SUCCEEDED = "succeeded";
    private static final String STATUS_FAILED = "failed";

    private final SeedanceClient seedanceClient;
    private final VideoStorageService videoStorageService;
    private final ReferenceImageService referenceImageService;
    private final GenerationRecordService generationRecordService;
    private final Map<String, String> localVideoUrlByTaskId = new ConcurrentHashMap<>();

    public VideoGenerateService(
            SeedanceClient seedanceClient,
            VideoStorageService videoStorageService,
            ReferenceImageService referenceImageService,
            GenerationRecordService generationRecordService) {
        this.seedanceClient = seedanceClient;
        this.videoStorageService = videoStorageService;
        this.referenceImageService = referenceImageService;
        this.generationRecordService = generationRecordService;
    }

    public VideoTaskCreateResponse createTextToVideo(VideoGenerateRequest request) {
        String taskId = seedanceClient.createTextToVideoTask(request);
        VideoTaskCreateResponse response = buildCreateResponse(taskId);
        generationRecordService.createVideoTask(
                AssetGenerationType.TEXT_TO_VIDEO, request, taskId, response.getStatus(), null);
        return response;
    }

    public VideoTaskCreateResponse createImageToVideo(
            VideoGenerateRequest request,
            MultipartFile firstImage,
            MultipartFile lastImage) {
        ReferenceImageService.PreparedReference firstRef = referenceImageService.prepare(firstImage);
        String lastDataUri = null;
        String lastRefUrl = null;
        if (lastImage != null && !lastImage.isEmpty()) {
            ReferenceImageService.PreparedReference lastRef = referenceImageService.prepare(lastImage);
            lastDataUri = lastRef.dataUri();
            lastRefUrl = lastRef.referenceUrl();
        }
        String taskId = seedanceClient.createImageToVideoTask(
                request, firstRef.dataUri(), lastDataUri);
        log.info("图生视频任务已提交, taskId={}, firstFrame={}, lastFrame={}",
                taskId, firstRef.referenceUrl(), lastRefUrl);
        VideoTaskCreateResponse response = buildCreateResponse(taskId);
        generationRecordService.createVideoTask(
                AssetGenerationType.IMAGE_TO_VIDEO, request, taskId, response.getStatus(), firstRef.referenceUrl());
        return response;
    }

    public VideoTaskResponse getTask(String taskId) {
        SeedanceTaskResponse task = seedanceClient.getTask(taskId);
        VideoTaskResponse response = new VideoTaskResponse();
        response.setTaskId(task.getId() != null ? task.getId() : taskId);
        response.setStatus(task.getStatus());
        response.setResolution(task.getResolution());
        response.setRatio(task.getRatio());
        response.setDuration(task.getDuration());

        if (task.getError() != null) {
            response.setErrorMessage(task.getError().getMessage());
        }

        if (STATUS_FAILED.equalsIgnoreCase(task.getStatus())) {
            if (response.getErrorMessage() == null) {
                response.setErrorMessage("视频生成失败");
            }
            generationRecordService.updateVideoTask(
                    taskId, task.getStatus(), null, null, response.getErrorMessage());
            return response;
        }

        if (STATUS_SUCCEEDED.equalsIgnoreCase(task.getStatus())
                && task.getContent() != null
                && task.getContent().getVideoUrl() != null) {
            String remoteUrl = task.getContent().getVideoUrl();
            response.setRemoteUrl(remoteUrl);
            String storageUrl = localVideoUrlByTaskId.computeIfAbsent(
                    taskId, id -> videoStorageService.downloadAndSave(remoteUrl));
            response.setUrl(storageUrl);
            generationRecordService.updateVideoTask(taskId, task.getStatus(), storageUrl, remoteUrl, null);
            log.info("视频任务完成, taskId={}, url={}", taskId, storageUrl);
            return response;
        }

        generationRecordService.updateVideoTask(taskId, task.getStatus(), null, null, null);
        return response;
    }

    private VideoTaskCreateResponse buildCreateResponse(String taskId) {
        try {
            SeedanceTaskResponse task = seedanceClient.getTask(taskId);
            return new VideoTaskCreateResponse(taskId, task.getStatus() != null ? task.getStatus() : "queued");
        } catch (SeedanceApiException ex) {
            log.warn("创建任务后查询状态失败, taskId={}, message={}", taskId, ex.getMessage());
            return new VideoTaskCreateResponse(taskId, "queued");
        }
    }
}
