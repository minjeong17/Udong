package com.udong.backend.votes.entity;

import com.udong.backend.chat.entity.ChatRoom;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "votes")
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String title; // 투표 제목

    @Column(length = 300)
    private String description; // 투표 설명

    @Column(nullable = false)
    private LocalDateTime endsAt; // 투표 마감 일시

    @Column(nullable = false)
    private boolean multiSelect; // 다중 선택 가능 여부 (true: 다중, false: 단일)

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @Column(name = "created_by", nullable = false)
    private Integer createdBy; // 투표를 생성한 유저의 ID

    @OneToMany(mappedBy = "vote", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VoteOption> options = new ArrayList<>();
}
