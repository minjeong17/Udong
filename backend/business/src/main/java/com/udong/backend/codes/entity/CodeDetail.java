package com.udong.backend.codes.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "code_detail")
public class CodeDetail {
    @Id
    @Column(name = "code_name", length = 50, nullable = false)
    private String codeName;

    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Column(name = "is_use", nullable = false)
    private boolean isUse = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_name", nullable = false)
    private CodeGroup codeGroup;
}
