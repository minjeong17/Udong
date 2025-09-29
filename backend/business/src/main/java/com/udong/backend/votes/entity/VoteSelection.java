package com.udong.backend.votes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "vote_selections")
public class VoteSelection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // 각 '투표 행위'의 고유 ID

    @Column(name = "user_id", nullable = false)
    private Integer userId; // 투표한 사용자 ID

    @Column(name = "option_count", nullable = false)
    private Integer optionCount; // 항목에 투표한 숫자

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_id", nullable = false)
    private Vote vote; // 어떤 투표에 대한 행위인지

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_option_id", nullable = false)
    private VoteOption voteOption; // 어떤 항목을 선택했는지

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
