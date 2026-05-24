package com.pixelcraftforge.storage;

import com.pixelcraftforge.config.UploadProperties;
import com.pixelcraftforge.exception.ApiException;
import jakarta.annotation.PostConstruct;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalGeneratedAssetStorage implements GeneratedAssetStorage {

    private static final Logger log = LoggerFactory.getLogger(LocalGeneratedAssetStorage.class);

    private final OkHttpClient okHttpClient;
    private final UploadProperties uploadProperties;
    private final Map<StorageCategory, Path> directories = new EnumMap<>(StorageCategory.class);

    public LocalGeneratedAssetStorage(OkHttpClient okHttpClient, UploadProperties uploadProperties) {
        this.okHttpClient = okHttpClient;
        this.uploadProperties = uploadProperties;
    }

    @PostConstruct
    void init() throws IOException {
        directories.put(StorageCategory.ELEMENTS, ensureDir(uploadProperties.getElementsPath()));
        directories.put(StorageCategory.VIDEOS, ensureDir(uploadProperties.getVideosPath()));
        directories.put(StorageCategory.REFERENCES, ensureDir(uploadProperties.getReferencesPath()));
        log.info("本地存储已启用, baseDir={}", uploadProperties.getBaseDir());
    }

    @Override
    public String storeFromRemoteUrl(String remoteUrl, StorageCategory category) {
        Request request = new Request.Builder().url(remoteUrl).get().build();
        try (Response response = okHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY.value(),
                        "下载远程资源失败: HTTP " + response.code());
            }
            String fileName = UUID.randomUUID() + category.getDefaultExtension();
            return storeBytes(response.body().bytes(), fileName, category.getDefaultContentType(), category);
        } catch (IOException ex) {
            log.error("下载远程资源失败, url={}", remoteUrl, ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "下载远程资源失败: " + ex.getMessage());
        }
    }

    @Override
    public String storeBytes(byte[] bytes, String fileName, String contentType, StorageCategory category) {
        Path targetFile = directories.get(category).resolve(fileName);
        try {
            Files.write(targetFile, bytes);
            String publicUrl = "/uploads/" + category.getFolder() + "/" + fileName;
            log.info("本地保存完成, category={}, path={}, url={}", category, targetFile, publicUrl);
            return publicUrl;
        } catch (IOException ex) {
            log.error("本地保存失败, category={}, file={}", category, fileName, ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "本地保存失败: " + ex.getMessage());
        }
    }

    private Path ensureDir(String path) throws IOException {
        Path directory = Path.of(path).toAbsolutePath().normalize();
        Files.createDirectories(directory);
        return directory;
    }
}
