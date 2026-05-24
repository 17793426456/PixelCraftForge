package com.pixelcraftforge.storage;

public interface GeneratedAssetStorage {

    String storeFromRemoteUrl(String remoteUrl, StorageCategory category);

    String storeBytes(byte[] bytes, String fileName, String contentType, StorageCategory category);
}
