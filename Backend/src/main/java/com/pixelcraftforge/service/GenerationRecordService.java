package com.pixelcraftforge.service;

import com.pixelcraftforge.dto.ElementGenerateRequest;
import com.pixelcraftforge.dto.VideoGenerateRequest;
import com.pixelcraftforge.entity.GenerationRecord;
import com.pixelcraftforge.entity.GenerationStatus;
import com.pixelcraftforge.entity.AssetGenerationType;
import com.pixelcraftforge.repository.GenerationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GenerationRecordService {

    private static final Logger log = LoggerFactory.getLogger(GenerationRecordService.class);

    private final GenerationRecordRepository generationRecordRepository;

    public GenerationRecordService(GenerationRecordRepository generationRecordRepository) {
        this.generationRecordRepository = generationRecordRepository;
    }

    @Transactional
    public void saveImageResult(
            AssetGenerationType type,
            String prompt,
            String style,
            Integer width,
            Integer height,
            String storageUrl,
            String remoteUrl,
            String referenceUrl,
            boolean cached) {
        GenerationRecord record = new GenerationRecord();
        record.setGenerationType(type);
        record.setPrompt(prompt);
        record.setStyle(style);
        record.setWidth(width);
        record.setHeight(height);
        record.setStorageUrl(storageUrl);
        record.setRemoteUrl(remoteUrl);
        record.setReferenceUrl(referenceUrl);
        record.setStatus(GenerationStatus.SUCCEEDED);
        record.setCached(cached);
        generationRecordRepository.save(record);
        log.info("生成记录已入库, type={}, id={}", type, record.getId());
    }

    @Transactional
    public void saveImageFromRequest(
            AssetGenerationType type,
            ElementGenerateRequest request,
            String storageUrl,
            String remoteUrl,
            String referenceUrl,
            boolean cached) {
        saveImageResult(
                type,
                request.getPrompt(),
                request.getStyle(),
                request.getWidth(),
                request.getHeight(),
                storageUrl,
                remoteUrl,
                referenceUrl,
                cached
        );
    }

    @Transactional
    public GenerationRecord createVideoTask(
            AssetGenerationType type,
            VideoGenerateRequest request,
            String externalTaskId,
            String initialStatus,
            String referenceUrl) {
        GenerationRecord record = new GenerationRecord();
        record.setGenerationType(type);
        record.setPrompt(request.getPrompt());
        record.setRatio(request.getRatio());
        record.setDuration(request.getDuration());
        record.setResolution(request.getResolution());
        record.setExternalTaskId(externalTaskId);
        record.setReferenceUrl(referenceUrl);
        record.setStatus(mapVideoStatus(initialStatus));
        record.setCached(false);
        GenerationRecord saved = generationRecordRepository.save(record);
        log.info("视频任务记录已入库, taskId={}, id={}", externalTaskId, saved.getId());
        return saved;
    }

    @Transactional
    public void updateVideoTask(
            String externalTaskId,
            String status,
            String storageUrl,
            String remoteUrl,
            String errorMessage) {
        generationRecordRepository.findByExternalTaskId(externalTaskId).ifPresent(record -> {
            record.setStatus(mapVideoStatus(status));
            if (storageUrl != null) {
                record.setStorageUrl(storageUrl);
            }
            if (remoteUrl != null) {
                record.setRemoteUrl(remoteUrl);
            }
            record.setErrorMessage(errorMessage);
            generationRecordRepository.save(record);
            log.info("视频任务记录已更新, taskId={}, status={}", externalTaskId, record.getStatus());
        });
    }

    public Page<GenerationRecord> list(Pageable pageable) {
        return generationRecordRepository.findAll(pageable);
    }

    public Page<GenerationRecord> listByType(AssetGenerationType type, Pageable pageable) {
        return generationRecordRepository.findByGenerationType(type, pageable);
    }

    private GenerationStatus mapVideoStatus(String status) {
        if (status == null) {
            return GenerationStatus.QUEUED;
        }
        return switch (status.toLowerCase()) {
            case "running" -> GenerationStatus.RUNNING;
            case "succeeded" -> GenerationStatus.SUCCEEDED;
            case "failed" -> GenerationStatus.FAILED;
            default -> GenerationStatus.QUEUED;
        };
    }
}
