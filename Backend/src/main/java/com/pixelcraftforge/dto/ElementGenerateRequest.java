package com.pixelcraftforge.dto;

import com.pixelcraftforge.entity.AssetCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ElementGenerateRequest {

    @NotBlank(message = "prompt 不能为空")
    private String prompt;

    @NotNull(message = "width 不能为空")
    @Min(value = 64, message = "width 最小为 64")
    @Max(value = 2048, message = "width 最大为 2048")
    private Integer width;

    @NotNull(message = "height 不能为空")
    @Min(value = 64, message = "height 最小为 64")
    @Max(value = 2048, message = "height 最大为 2048")
    private Integer height;

    private String style;

    @NotNull(message = "category 不能为空")
    private AssetCategory category;

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public String getStyle() {
        return style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public AssetCategory getCategory() {
        return category;
    }

    public void setCategory(AssetCategory category) {
        this.category = category;
    }
}
