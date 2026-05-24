package com.pixelcraftforge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SeedreamApiRequest {

    private String model;
    private String prompt;
    private String size;

    private String image;

    @JsonProperty("sequential_image_generation")
    private String sequentialImageGeneration = "disabled";

    @JsonProperty("response_format")
    private String responseFormat = "url";

    @JsonProperty("output_format")
    private String outputFormat = "png";

    private boolean watermark = false;

    public SeedreamApiRequest() {
    }

    public SeedreamApiRequest(String model, String prompt, String size) {
        this.model = model;
        this.prompt = prompt;
        this.size = size;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getSequentialImageGeneration() {
        return sequentialImageGeneration;
    }

    public void setSequentialImageGeneration(String sequentialImageGeneration) {
        this.sequentialImageGeneration = sequentialImageGeneration;
    }

    public String getResponseFormat() {
        return responseFormat;
    }

    public void setResponseFormat(String responseFormat) {
        this.responseFormat = responseFormat;
    }

    public String getOutputFormat() {
        return outputFormat;
    }

    public void setOutputFormat(String outputFormat) {
        this.outputFormat = outputFormat;
    }

    public boolean isWatermark() {
        return watermark;
    }

    public void setWatermark(boolean watermark) {
        this.watermark = watermark;
    }
}
