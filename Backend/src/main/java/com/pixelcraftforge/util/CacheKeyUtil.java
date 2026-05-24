package com.pixelcraftforge.util;

import com.pixelcraftforge.dto.ElementGenerateRequest;

public final class CacheKeyUtil {

    private CacheKeyUtil() {
    }

    public static String buildKey(ElementGenerateRequest request) {
        String style = request.getStyle() == null ? "" : request.getStyle();
        return "t2i|" + request.getPrompt() + "|" + request.getWidth() + "|" + request.getHeight() + "|" + style;
    }

    public static String buildImageToImageKey(String prompt, int width, int height, String style, String imageHash) {
        String normalizedStyle = style == null ? "" : style;
        return "i2i|" + imageHash + "|" + prompt + "|" + width + "|" + height + "|" + normalizedStyle;
    }
}
