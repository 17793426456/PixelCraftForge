package com.pixelcraftforge.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "seedream")
public class SeedreamProperties {

    private final Api api = new Api();
    private final Model model = new Model();

    public Api getApi() {
        return api;
    }

    public Model getModel() {
        return model;
    }

    public static class Api {
        private String url;
        private String key;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }
    }

    public static class Model {
        private String id;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }
    }
}
