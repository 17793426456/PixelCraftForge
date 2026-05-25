package com.pixelcraftforge.dto;

/**
 * 前端可用的运行时配置（不含密钥）。
 */
public class AppConfigResponse {

    private String storageType;
    private String mediaBaseUrl;
    private long videoPollIntervalMs;
    private int videoPollMaxAttempts;
    private String seedreamModelId;
    private String seedanceModelId;

    public String getStorageType() {
        return storageType;
    }

    public void setStorageType(String storageType) {
        this.storageType = storageType;
    }

    public String getMediaBaseUrl() {
        return mediaBaseUrl;
    }

    public void setMediaBaseUrl(String mediaBaseUrl) {
        this.mediaBaseUrl = mediaBaseUrl;
    }

    public long getVideoPollIntervalMs() {
        return videoPollIntervalMs;
    }

    public void setVideoPollIntervalMs(long videoPollIntervalMs) {
        this.videoPollIntervalMs = videoPollIntervalMs;
    }

    public int getVideoPollMaxAttempts() {
        return videoPollMaxAttempts;
    }

    public void setVideoPollMaxAttempts(int videoPollMaxAttempts) {
        this.videoPollMaxAttempts = videoPollMaxAttempts;
    }

    public String getSeedreamModelId() {
        return seedreamModelId;
    }

    public void setSeedreamModelId(String seedreamModelId) {
        this.seedreamModelId = seedreamModelId;
    }

    public String getSeedanceModelId() {
        return seedanceModelId;
    }

    public void setSeedanceModelId(String seedanceModelId) {
        this.seedanceModelId = seedanceModelId;
    }
}
