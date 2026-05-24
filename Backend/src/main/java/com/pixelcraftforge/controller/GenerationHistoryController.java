package com.pixelcraftforge.controller;

import com.pixelcraftforge.dto.GenerationRecordResponse;
import com.pixelcraftforge.entity.AssetGenerationType;
import com.pixelcraftforge.service.GenerationRecordService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/generations")
public class GenerationHistoryController {

    private final GenerationRecordService generationRecordService;

    public GenerationHistoryController(GenerationRecordService generationRecordService) {
        this.generationRecordService = generationRecordService;
    }

    @GetMapping
    public ResponseEntity<Page<GenerationRecordResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) AssetGenerationType type) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GenerationRecordResponse> result = (type == null
                ? generationRecordService.list(pageable)
                : generationRecordService.listByType(type, pageable))
                .map(GenerationRecordResponse::from);
        return ResponseEntity.ok(result);
    }
}
