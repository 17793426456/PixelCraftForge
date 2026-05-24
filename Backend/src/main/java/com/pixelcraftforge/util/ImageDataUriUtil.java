package com.pixelcraftforge.util;

import java.util.Base64;

public final class ImageDataUriUtil {

    private ImageDataUriUtil() {
    }

    public static String toDataUri(byte[] bytes, String contentType) {
        String mimeType = normalizeMimeType(contentType);
        return "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private static String normalizeMimeType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "image/png";
        }
        int semicolonIndex = contentType.indexOf(';');
        if (semicolonIndex > 0) {
            return contentType.substring(0, semicolonIndex);
        }
        return contentType;
    }
}
