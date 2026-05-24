package com.pixelcraftforge.exception;

public class SeedreamApiException extends ApiException {

    public SeedreamApiException(String message) {
        super(502, message);
    }
}
