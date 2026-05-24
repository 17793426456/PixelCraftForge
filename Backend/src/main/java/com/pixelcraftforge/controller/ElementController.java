package com.pixelcraftforge.controller;

import com.pixelcraftforge.dto.ElementGenerateRequest;
import com.pixelcraftforge.dto.ElementGenerateResponse;
import com.pixelcraftforge.entity.AssetCategory;
import com.pixelcraftforge.service.ElementGenerateService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/element")
@Validated
public class ElementController {

    private static final Logger log = LoggerFactory.getLogger(ElementController.class);

    private final ElementGenerateService elementGenerateService;

    public ElementController(ElementGenerateService elementGenerateService) {
        this.elementGenerateService = elementGenerateService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ElementGenerateResponse> generate(@Valid @RequestBody ElementGenerateRequest request) {
        log.info("收到文生图请求, prompt={}, size={}x{}, style={}, category={}",
                request.getPrompt(), request.getWidth(), request.getHeight(), request.getStyle(), request.getCategory());
        ElementGenerateResponse response = elementGenerateService.generate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/image-to-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ElementGenerateResponse> imageToImage(
            @RequestPart("image") MultipartFile image,
            @RequestParam("prompt") @NotBlank(message = "prompt 不能为空") String prompt,
            @RequestParam("width") @NotNull(message = "width 不能为空")
            @Min(value = 64, message = "width 最小为 64") @Max(value = 2048, message = "width 最大为 2048") Integer width,
            @RequestParam("height") @NotNull(message = "height 不能为空")
            @Min(value = 64, message = "height 最小为 64") @Max(value = 2048, message = "height 最大为 2048") Integer height,
            @RequestParam(value = "style", required = false) String style,
            @RequestParam("category") @NotNull(message = "category 不能为空") AssetCategory category) {
        log.info("收到图生图请求, prompt={}, size={}x{}, style={}, category={}, file={}",
                prompt, width, height, style, category, image.getOriginalFilename());
        ElementGenerateResponse response = elementGenerateService.generateFromImage(
                image, prompt, width, height, style, category);
        return ResponseEntity.ok(response);
    }
}
