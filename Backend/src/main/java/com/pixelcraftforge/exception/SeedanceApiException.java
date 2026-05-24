package com.pixelcraftforge.exception;

public class SeedanceApiException extends ApiException {

    public SeedanceApiException(String message) {
        super(502, message);
    }
}
