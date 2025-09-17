package com.udong.backend.codes.dto;

import com.udong.backend.codes.entity.CodeDetail;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class DetailResponse {
    private String codeName;
    private String name;
    private String groupName;

    // Entity -> DTO 변환 메소드
    public DetailResponse(CodeDetail codeDetail) {
        this.codeName = codeDetail.getCodeName();
        this.name = codeDetail.getName();
        this.groupName = codeDetail.getCodeGroup().getGroupName();
    }
}
