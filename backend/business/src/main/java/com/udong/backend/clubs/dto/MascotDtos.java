package com.udong.backend.clubs.dto;


import java.time.Instant;


public class MascotDtos {
    public record Res(Integer id, Integer clubId, String imageUrl, String promptMeta, Instant createdAt) {}
}