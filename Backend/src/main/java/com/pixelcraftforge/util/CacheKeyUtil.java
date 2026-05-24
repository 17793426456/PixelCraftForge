package com.pixelcraftforge.util;

import com.pixelcraftforge.dto.ElementGenerateRequest;

public final class CacheKeyUtil {

    private CacheKeyUtil() {
    }

    public static String buildKey(ElementGenerateRequest request) {
        String style = request.getStyle() == null ? "" : request.getStyle();
        String category = request.getCategory() == null ? "" : request.getCategory().name();
        return "t2i|" + category + "|" + request.getPrompt() + "|" + request.getWidth() + "|" + request.getHeight() + "|" + style;
    }

    public static String buildImageToImageKey(
            String prompt, int width, int height, String style, String category, String imageHash) {
        String normalizedStyle = style == null ? "" : style;
        String normalizedCategory = category == null ? "" : category;
        return "i2i|" + imageHash + "|" + normalizedCategory + "|" + prompt + "|" + width + "|" + height + "|" + normalizedStyle;
    }
}
