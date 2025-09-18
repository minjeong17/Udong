package com.udong.backend.codes.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "code_group")
public class CodeGroup {
    @Id
    @Column(name = "group_name", length = 20, nullable = false)
    private String groupName;

    @Column(name = "name", length = 20, nullable = false)
    private String name;

    @Column(name = "is_use", nullable = false)
    private boolean isUse = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createAt;

    @OneToMany(mappedBy = "codeGroup", fetch = FetchType.LAZY)
    private List<CodeDetail> details = new ArrayList<>();
}
