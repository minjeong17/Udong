package com.udong.backend.global.s3;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Objects;

@Component
public class HttpDownloader {
    private final OkHttpClient http = new OkHttpClient();

    public byte[] getBytes(String url) throws IOException {
        try (Response res = http.newCall(new Request.Builder().url(url).build()).execute()) {
            if (!res.isSuccessful()) throw new IOException("download failed: " + res.code());
            return Objects.requireNonNull(res.body()).bytes();
        }
    }
}

