package com.pixelcraftforge.controller;

import com.pixelcraftforge.dto.VideoGenerateRequest;
import com.pixelcraftforge.dto.VideoTaskCreateResponse;
import com.pixelcraftforge.dto.VideoTaskResponse;
import com.pixelcraftforge.entity.AssetCategory;
import com.pixelcraftforge.service.VideoGenerateService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/video")
@Validated
public class VideoController {

    private static final Logger log = LoggerFactory.getLogger(VideoController.class);

    private final VideoGenerateService videoGenerateService;

    public VideoController(VideoGenerateService videoGenerateService) {
        this.videoGenerateService = videoGenerateService;
    }

    @PostMapping("/generate")
    public ResponseEntity<VideoTaskCreateResponse> generate(@Valid @RequestBody VideoGenerateRequest request) {
        log.info("收到文生视频请求, prompt={}, ratio={}, duration={}s, resolution={}, generateAudio={}, category={}",
                request.getPrompt(), request.getRatio(), request.getDuration(), request.getResolution(),
                request.getGenerateAudio(), request.getCategory());
        return ResponseEntity.ok(videoGenerateService.createTextToVideo(request));
    }

    @PostMapping(value = "/image-to-video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoTaskCreateResponse> imageToVideo(
            @RequestPart("image") MultipartFile image,
            @RequestParam("prompt") @NotBlank(message = "prompt 不能为空") String prompt,
            @RequestParam(value = "ratio", defaultValue = "16:9")
            @Pattern(regexp = "^(adaptive|21:9|16:9|4:3|1:1|3:4|9:16)$", message = "ratio 格式不正确") String ratio,
            @RequestParam(value = "duration", defaultValue = "5")
            @Min(value = 5, message = "duration 最小为 5 秒") @Max(value = 10, message = "duration 最大为 10 秒") Integer duration,
            @RequestParam(value = "resolution", defaultValue = "1080p")
            @Pattern(regexp = "^(480p|720p|1080p)$", message = "resolution 仅支持 480p/720p/1080p") String resolution,
            @RequestParam(value = "generateAudio", defaultValue = "true") Boolean generateAudio,
            @RequestParam(value = "watermark", defaultValue = "false") Boolean watermark,
            @RequestParam("category") @NotNull(message = "category 不能为空") AssetCategory category) {
        VideoGenerateRequest request = buildRequest(
                prompt, ratio, duration, resolution, generateAudio, watermark, category);
        log.info("收到图生视频请求, prompt={}, ratio={}, duration={}s, category={}, file={}",
                prompt, ratio, duration, category, image.getOriginalFilename());
        return ResponseEntity.ok(videoGenerateService.createImageToVideo(request, image));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<VideoTaskResponse> getTask(@PathVariable String taskId) {
        log.info("查询视频任务, taskId={}", taskId);
        return ResponseEntity.ok(videoGenerateService.getTask(taskId));
    }

    private VideoGenerateRequest buildRequest(
            String prompt,
            String ratio,
            Integer duration,
            String resolution,
            Boolean generateAudio,
            Boolean watermark,
            AssetCategory category) {
        VideoGenerateRequest request = new VideoGenerateRequest();
        request.setPrompt(prompt);
        request.setRatio(ratio);
        request.setDuration(duration);
        request.setResolution(resolution);
        request.setGenerateAudio(generateAudio);
        request.setWatermark(watermark);
        request.setCategory(category);
        return request;
    }
}
