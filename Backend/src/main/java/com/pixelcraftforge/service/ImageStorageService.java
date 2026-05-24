package com.pixelcraftforge.service;

import com.pixelcraftforge.storage.GeneratedAssetStorage;
import com.pixelcraftforge.storage.StorageCategory;
import org.springframework.stereotype.Service;

@Service
public class ImageStorageService {

    private final GeneratedAssetStorage generatedAssetStorage;

    public ImageStorageService(GeneratedAssetStorage generatedAssetStorage) {
        this.generatedAssetStorage = generatedAssetStorage;
    }

    public String downloadAndSave(String imageUrl) {
        return generatedAssetStorage.storeFromRemoteUrl(imageUrl, StorageCategory.ELEMENTS);
    }
}
