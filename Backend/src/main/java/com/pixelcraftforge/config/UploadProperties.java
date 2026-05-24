package com.pixelcraftforge.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {

    private String baseDir = "./uploads";
    private String elementsDir = "elements";
    private String referencesDir = "references";
    private String videosDir = "videos";

    public String getBaseDir() {
        return baseDir;
    }

    public void setBaseDir(String baseDir) {
        this.baseDir = baseDir;
    }

    public String getElementsDir() {
        return elementsDir;
    }

    public void setElementsDir(String elementsDir) {
        this.elementsDir = elementsDir;
    }

    public String getReferencesDir() {
        return referencesDir;
    }

    public void setReferencesDir(String referencesDir) {
        this.referencesDir = referencesDir;
    }

    public String getVideosDir() {
        return videosDir;
    }

    public void setVideosDir(String videosDir) {
        this.videosDir = videosDir;
    }

    public String getElementsPath() {
        return baseDir + "/" + elementsDir;
    }

    public String getReferencesPath() {
        return baseDir + "/" + referencesDir;
    }

    public String getVideosPath() {
        return baseDir + "/" + videosDir;
    }
}
