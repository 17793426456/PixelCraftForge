package com.pixelcraftforge.controller;

import com.pixelcraftforge.config.OssProperties;
import com.pixelcraftforge.config.SeedanceProperties;
import com.pixelcraftforge.config.SeedreamProperties;
import com.pixelcraftforge.config.StorageProperties;
import com.pixelcraftforge.dto.AppConfigResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class AppConfigController {

    private final StorageProperties storageProperties;
    private final OssProperties ossProperties;
    private final SeedreamProperties seedreamProperties;
    private final SeedanceProperties seedanceProperties;

    public AppConfigController(
            StorageProperties storageProperties,
            OssProperties ossProperties,
            SeedreamProperties seedreamProperties,
            SeedanceProperties seedanceProperties) {
        this.storageProperties = storageProperties;
        this.ossProperties = ossProperties;
        this.seedreamProperties = seedreamProperties;
        this.seedanceProperties = seedanceProperties;
    }

    @GetMapping
    public ResponseEntity<AppConfigResponse> getConfig() {
        AppConfigResponse body = new AppConfigResponse();
        body.setStorageType(storageProperties.getType());
        body.setMediaBaseUrl(resolveMediaBaseUrl());
        body.setVideoPollIntervalMs(seedanceProperties.getPoll().getIntervalMs());
        body.setVideoPollMaxAttempts(seedanceProperties.getPoll().getMaxAttempts());
        body.setSeedreamModelId(seedreamProperties.getModel().getId());
        body.setSeedanceModelId(seedanceProperties.getModel().getId());
        return ResponseEntity.ok(body);
    }

    private String resolveMediaBaseUrl() {
        if (storageProperties.isOssEnabled() && ossProperties.isConfigured()) {
            String base = ossProperties.getPublicBaseUrl();
            return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        }
        return "";
    }
}
