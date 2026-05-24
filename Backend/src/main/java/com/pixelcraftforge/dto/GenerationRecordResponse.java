package com.pixelcraftforge.dto;

import com.pixelcraftforge.entity.GenerationRecord;
import com.pixelcraftforge.entity.GenerationStatus;
import com.pixelcraftforge.entity.AssetGenerationType;

import java.time.LocalDateTime;

public class GenerationRecordResponse {

    private Long id;
    private AssetGenerationType generationType;
    private String prompt;
    private String style;
    private Integer width;
    private Integer height;
    private String ratio;
    private Integer duration;
    private String resolution;
    private String storageUrl;
    private String remoteUrl;
    private String referenceUrl;
    private String externalTaskId;
    private GenerationStatus status;
    private boolean cached;
    private String errorMessage;
    private LocalDateTime createdAt;

    public static GenerationRecordResponse from(GenerationRecord record) {
        GenerationRecordResponse response = new GenerationRecordResponse();
        response.setId(record.getId());
        response.setGenerationType(record.getGenerationType());
        response.setPrompt(record.getPrompt());
        response.setStyle(record.getStyle());
        response.setWidth(record.getWidth());
        response.setHeight(record.getHeight());
        response.setRatio(record.getRatio());
        response.setDuration(record.getDuration());
        response.setResolution(record.getResolution());
        response.setStorageUrl(record.getStorageUrl());
        response.setRemoteUrl(record.getRemoteUrl());
        response.setReferenceUrl(record.getReferenceUrl());
        response.setExternalTaskId(record.getExternalTaskId());
        response.setStatus(record.getStatus());
        response.setCached(record.isCached());
        response.setErrorMessage(record.getErrorMessage());
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AssetGenerationType getGenerationType() {
        return generationType;
    }

    public void setGenerationType(AssetGenerationType generationType) {
        this.generationType = generationType;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getStyle() {
        return style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public String getRatio() {
        return ratio;
    }

    public void setRatio(String ratio) {
        this.ratio = ratio;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getStorageUrl() {
        return storageUrl;
    }

    public void setStorageUrl(String storageUrl) {
        this.storageUrl = storageUrl;
    }

    public String getRemoteUrl() {
        return remoteUrl;
    }

    public void setRemoteUrl(String remoteUrl) {
        this.remoteUrl = remoteUrl;
    }

    public String getReferenceUrl() {
        return referenceUrl;
    }

    public void setReferenceUrl(String referenceUrl) {
        this.referenceUrl = referenceUrl;
    }

    public String getExternalTaskId() {
        return externalTaskId;
    }

    public void setExternalTaskId(String externalTaskId) {
        this.externalTaskId = externalTaskId;
    }

    public GenerationStatus getStatus() {
        return status;
    }

    public void setStatus(GenerationStatus status) {
        this.status = status;
    }

    public boolean isCached() {
        return cached;
    }

    public void setCached(boolean cached) {
        this.cached = cached;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
