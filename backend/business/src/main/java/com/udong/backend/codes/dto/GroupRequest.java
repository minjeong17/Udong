package com.udong.backend.codes.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@ToString
public class GroupRequest {
    private String groupName;
    private String name;
}
