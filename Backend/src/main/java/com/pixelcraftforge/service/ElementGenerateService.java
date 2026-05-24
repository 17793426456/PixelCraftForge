package com.pixelcraftforge.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.pixelcraftforge.dto.ElementGenerateRequest;
import com.pixelcraftforge.dto.ElementGenerateResponse;
import com.pixelcraftforge.entity.AssetCategory;
import com.pixelcraftforge.entity.AssetGenerationType;
import com.pixelcraftforge.util.CacheKeyUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ElementGenerateService {

    private static final Logger log = LoggerFactory.getLogger(ElementGenerateService.class);

    private final Cache<String, String> elementImageCache;
    private final SeedreamClient seedreamClient;
    private final ImageStorageService imageStorageService;
    private final ReferenceImageService referenceImageService;
    private final GenerationRecordService generationRecordService;

    public ElementGenerateService(
            Cache<String, String> elementImageCache,
            SeedreamClient seedreamClient,
            ImageStorageService imageStorageService,
            ReferenceImageService referenceImageService,
            GenerationRecordService generationRecordService) {
        this.elementImageCache = elementImageCache;
        this.seedreamClient = seedreamClient;
        this.imageStorageService = imageStorageService;
        this.referenceImageService = referenceImageService;
        this.generationRecordService = generationRecordService;
    }

    public ElementGenerateResponse generate(ElementGenerateRequest request) {
        String cacheKey = CacheKeyUtil.buildKey(request);
        String cachedUrl = elementImageCache.getIfPresent(cacheKey);
        if (cachedUrl != null) {
            log.info("命中缓存, key={}", cacheKey);
            generationRecordService.saveImageFromRequest(
                    AssetGenerationType.TEXT_TO_IMAGE, request, cachedUrl, null, null, true);
            return new ElementGenerateResponse(cachedUrl, true);
        }

        String remoteImageUrl = seedreamClient.generateTextToImage(
                request.getPrompt(),
                request.getWidth(),
                request.getHeight()
        );
        String storageUrl = imageStorageService.downloadAndSave(remoteImageUrl);
        elementImageCache.put(cacheKey, storageUrl);
        generationRecordService.saveImageFromRequest(
                AssetGenerationType.TEXT_TO_IMAGE, request, storageUrl, remoteImageUrl, null, false);
        log.info("文生图完成并已缓存, key={}, url={}", cacheKey, storageUrl);
        return new ElementGenerateResponse(storageUrl, false);
    }

    public ElementGenerateResponse generateFromImage(
            MultipartFile image,
            String prompt,
            int width,
            int height,
            String style,
            AssetCategory category) {
        ReferenceImageService.PreparedReference reference = referenceImageService.prepare(image);
        String categoryName = category == null ? "" : category.name();
        String cacheKey = CacheKeyUtil.buildImageToImageKey(
                prompt, width, height, style, categoryName, reference.imageHash());
        String cachedUrl = elementImageCache.getIfPresent(cacheKey);
        if (cachedUrl != null) {
            log.info("图生图命中缓存, key={}", cacheKey);
            ElementGenerateRequest request = buildRequest(prompt, width, height, style, category);
            generationRecordService.saveImageFromRequest(
                    AssetGenerationType.IMAGE_TO_IMAGE, request, cachedUrl, null, reference.referenceUrl(), true);
            return new ElementGenerateResponse(cachedUrl, true);
        }

        String remoteImageUrl = seedreamClient.generateImageToImage(
                prompt,
                width,
                height,
                reference.dataUri()
        );
        String storageUrl = imageStorageService.downloadAndSave(remoteImageUrl);
        elementImageCache.put(cacheKey, storageUrl);
        ElementGenerateRequest request = buildRequest(prompt, width, height, style, category);
        generationRecordService.saveImageFromRequest(
                AssetGenerationType.IMAGE_TO_IMAGE, request, storageUrl, remoteImageUrl, reference.referenceUrl(), false);
        log.info("图生图完成并已缓存, key={}, reference={}, url={}",
                cacheKey, reference.referenceUrl(), storageUrl);
        return new ElementGenerateResponse(storageUrl, false);
    }

    private ElementGenerateRequest buildRequest(
            String prompt, int width, int height, String style, AssetCategory category) {
        ElementGenerateRequest request = new ElementGenerateRequest();
        request.setPrompt(prompt);
        request.setWidth(width);
        request.setHeight(height);
        request.setStyle(style);
        request.setCategory(category);
        return request;
    }
}
