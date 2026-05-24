package com.pixelcraftforge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VideoGenerateRequest {

    @NotBlank(message = "prompt 不能为空")
    private String prompt;

    @Pattern(regexp = "^(adaptive|21:9|16:9|4:3|1:1|3:4|9:16)$", message = "ratio 格式不正确")
    private String ratio = "16:9";

    @Min(value = 5, message = "duration 最小为 5 秒")
    @Max(value = 10, message = "duration 最大为 10 秒")
    private Integer duration = 5;

    @Pattern(regexp = "^(480p|720p|1080p)$", message = "resolution 仅支持 480p/720p/1080p")
    private String resolution = "1080p";

    private Boolean generateAudio = true;

    private Boolean watermark = false;

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getRatio() {
        return ratio;
    }

    public void setRatio(String ratio) {
        this.ratio = ratio;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public Boolean getGenerateAudio() {
        return generateAudio;
    }

    public void setGenerateAudio(Boolean generateAudio) {
        this.generateAudio = generateAudio;
    }

    public Boolean getWatermark() {
        return watermark;
    }

    public void setWatermark(Boolean watermark) {
        this.watermark = watermark;
    }
}
