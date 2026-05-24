package com.pixelcraftforge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class SeedanceCreateTaskRequest {

    private String model;
    private List<ContentItem> content = new ArrayList<>();

    @JsonProperty("generate_audio")
    private boolean generateAudio = true;

    private String ratio = "16:9";
    private int duration = 5;
    private String resolution = "1080p";
    private boolean watermark = false;

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public List<ContentItem> getContent() {
        return content;
    }

    public void setContent(List<ContentItem> content) {
        this.content = content;
    }

    public boolean isGenerateAudio() {
        return generateAudio;
    }

    public void setGenerateAudio(boolean generateAudio) {
        this.generateAudio = generateAudio;
    }

    public String getRatio() {
        return ratio;
    }

    public void setRatio(String ratio) {
        this.ratio = ratio;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public boolean isWatermark() {
        return watermark;
    }

    public void setWatermark(boolean watermark) {
        this.watermark = watermark;
    }

    public static class ContentItem {
        private String type;
        private String text;

        @JsonProperty("image_url")
        private ImageUrl imageUrl;

        public static ContentItem text(String text) {
            ContentItem item = new ContentItem();
            item.setType("text");
            item.setText(text);
            return item;
        }

        public static ContentItem imageUrl(String url) {
            ContentItem item = new ContentItem();
            item.setType("image_url");
            ImageUrl image = new ImageUrl();
            image.setUrl(url);
            item.setImageUrl(image);
            return item;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public ImageUrl getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(ImageUrl imageUrl) {
            this.imageUrl = imageUrl;
        }
    }

    public static class ImageUrl {
        private String url;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }
}
