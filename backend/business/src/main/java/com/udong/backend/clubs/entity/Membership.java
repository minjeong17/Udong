// Membership 엔티티
package com.udong.backend.clubs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity @Table(name="memberships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","club_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Membership {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreationTimestamp
    @Column(name="created_at", nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @Column(name="user_id", nullable=false)
    private Integer userId;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="club_id", nullable=false)
    private Club club;

    @Column(name="role_code", nullable=false, length=50)
    private String roleCode;

}

