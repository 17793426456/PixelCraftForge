package com.pixelcraftforge.service;

import com.pixelcraftforge.storage.GeneratedAssetStorage;
import com.pixelcraftforge.storage.StorageCategory;
import org.springframework.stereotype.Service;

@Service
public class VideoStorageService {

    private final GeneratedAssetStorage generatedAssetStorage;

    public VideoStorageService(GeneratedAssetStorage generatedAssetStorage) {
        this.generatedAssetStorage = generatedAssetStorage;
    }

    public String downloadAndSave(String videoUrl) {
        return generatedAssetStorage.storeFromRemoteUrl(videoUrl, StorageCategory.VIDEOS);
    }
}
