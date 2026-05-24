package com.pixelcraftforge.storage;

public enum StorageCategory {

    ELEMENTS("elements", "image/png", ".png"),
    VIDEOS("videos", "video/mp4", ".mp4"),
    REFERENCES("references", "image/png", ".png");

    private final String folder;
    private final String defaultContentType;
    private final String defaultExtension;

    StorageCategory(String folder, String defaultContentType, String defaultExtension) {
        this.folder = folder;
        this.defaultContentType = defaultContentType;
        this.defaultExtension = defaultExtension;
    }

    public String getFolder() {
        return folder;
    }

    public String getDefaultContentType() {
        return defaultContentType;
    }

    public String getDefaultExtension() {
        return defaultExtension;
    }
}
