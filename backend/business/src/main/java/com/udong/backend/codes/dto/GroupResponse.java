package com.udong.backend.codes.dto;

import com.udong.backend.codes.entity.CodeGroup;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class GroupResponse {
    private String groupName;
    private String name;

    // Entity -> DTO 변환 메소드
    public GroupResponse(CodeGroup codeGroup) {
        this.groupName = codeGroup.getGroupName();
        this.name = codeGroup.getName();
    }
}
