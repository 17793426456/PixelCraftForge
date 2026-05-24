package com.pixelcraftforge.service;

import com.pixelcraftforge.exception.ApiException;
import com.pixelcraftforge.storage.GeneratedAssetStorage;
import com.pixelcraftforge.storage.StorageCategory;
import com.pixelcraftforge.util.ImageDataUriUtil;
import com.pixelcraftforge.util.ImageHashUtil;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ReferenceImageService {

    private static final Logger log = LoggerFactory.getLogger(ReferenceImageService.class);
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif",
            "application/octet-stream"
    );

    private final GeneratedAssetStorage generatedAssetStorage;

    public ReferenceImageService(GeneratedAssetStorage generatedAssetStorage) {
        this.generatedAssetStorage = generatedAssetStorage;
    }

    @PostConstruct
    void init() {
        log.info("参考图服务已就绪");
    }

    public PreparedReference prepare(MultipartFile image) {
        validateImage(image);

        try {
            byte[] bytes = image.getBytes();
            String imageHash = ImageHashUtil.sha256Hex(bytes);
            String dataUri = ImageDataUriUtil.toDataUri(bytes, resolveContentType(image));
            String extension = resolveExtension(image);
            String fileName = imageHash.substring(0, 16) + "-" + UUID.randomUUID() + extension;
            String contentType = resolveContentType(image);
            String referenceUrl = generatedAssetStorage.storeBytes(
                    bytes, fileName, contentType, StorageCategory.REFERENCES);
            log.info("参考图已保存, hash={}, url={}", imageHash, referenceUrl);
            return new PreparedReference(dataUri, imageHash, referenceUrl);
        } catch (IOException ex) {
            log.error("读取参考图失败", ex);
            throw new ApiException(HttpStatus.BAD_REQUEST.value(), "读取参考图失败: " + ex.getMessage());
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST.value(), "参考图不能为空");
        }

        String contentType = normalizeContentType(image.getContentType());
        if (ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return;
        }

        if (isAllowedExtension(image.getOriginalFilename())) {
            return;
        }

        if (detectContentType(image) != null) {
            return;
        }

        throw new ApiException(HttpStatus.BAD_REQUEST.value(),
                "不支持的图片格式，仅支持 PNG/JPEG/WEBP/GIF");
    }

    private String resolveContentType(MultipartFile image) {
        String contentType = normalizeContentType(image.getContentType());
        if (contentType.startsWith("image/") && !contentType.equals("image/jpg")) {
            return contentType;
        }
        if (contentType.equals("image/jpg")) {
            return "image/jpeg";
        }

        String detected = detectContentType(image);
        if (detected != null) {
            return detected;
        }

        return switch (resolveExtension(image)) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".webp" -> "image/webp";
            case ".gif" -> "image/gif";
            default -> "image/png";
        };
    }

    private String detectContentType(MultipartFile image) {
        try {
            byte[] header = image.getBytes();
            if (header.length >= 4 && header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
                return "image/png";
            }
            if (header.length >= 3 && header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
                return "image/jpeg";
            }
            if (header.length >= 3 && header[0] == 'G' && header[1] == 'I' && header[2] == 'F') {
                return "image/gif";
            }
            if (header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
                return "image/webp";
            }
        } catch (IOException ex) {
            log.warn("检测图片类型失败", ex);
        }
        return null;
    }

    private boolean isAllowedExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return false;
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        return Set.of(".png", ".jpg", ".jpeg", ".webp", ".gif").contains(extension);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        return contentType.toLowerCase(Locale.ROOT);
    }

    private String resolveExtension(MultipartFile image) {
        String originalName = image.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            return originalName.substring(originalName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        }

        return switch (normalizeContentType(image.getContentType())) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".png";
        };
    }

    public record PreparedReference(String dataUri, String imageHash, String referenceUrl) {
    }
}
