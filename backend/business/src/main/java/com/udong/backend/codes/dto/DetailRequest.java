package com.udong.backend.codes.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@ToString
public class DetailRequest {
    private String codeName;
    private String name;
    private String groupName;
}
