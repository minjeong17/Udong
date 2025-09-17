package com.udong.backend.clubs.s3;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Component
@RequiredArgsConstructor
public class S3Uploader {
    private final S3Client s3;
    @Value("${S3_BUCKET}") String bucket;
    @Value("${S3_PUBLIC_BASE_URL:}") String publicBaseUrl; // 없으면 S3 URL 구성
    @Value("${AWS_REGION}") String region;

    public String putPng(byte[] bytes, String key) {
        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("image/png")
                // 공개 제공이면 .acl(ObjectCannedACL.PUBLIC_READ) (버킷 정책으로 공개 권장)
                .build();
        s3.putObject(req, RequestBody.fromBytes(bytes));

        if (!publicBaseUrl.isBlank()) return publicBaseUrl + "/" + key;
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }
}

