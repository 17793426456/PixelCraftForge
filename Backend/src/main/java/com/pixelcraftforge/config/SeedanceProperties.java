package com.pixelcraftforge.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "seedance")
public class SeedanceProperties {

    private final Api api = new Api();
    private final Model model = new Model();
    private final Poll poll = new Poll();
    private boolean generateAudio = true;

    public Api getApi() {
        return api;
    }

    public Model getModel() {
        return model;
    }

    public Poll getPoll() {
        return poll;
    }

    public boolean isGenerateAudio() {
        return generateAudio;
    }

    public void setGenerateAudio(boolean generateAudio) {
        this.generateAudio = generateAudio;
    }

    public static class Api {
        private String baseUrl = "https://ark.cn-beijing.volces.com/api/v3";
        private String key;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getTasksUrl() {
            return baseUrl + "/contents/generations/tasks";
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

    public static class Poll {
        private long intervalMs = 10000;
        private int maxAttempts = 120;

        public long getIntervalMs() {
            return intervalMs;
        }

        public void setIntervalMs(long intervalMs) {
            this.intervalMs = intervalMs;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }
    }
}
