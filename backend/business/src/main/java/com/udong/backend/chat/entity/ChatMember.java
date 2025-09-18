package com.udong.backend.chat.entity;

import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "chat_members",
        uniqueConstraints = {
                // 동일 방에 같은 유저 중복 가입 방지
                @UniqueConstraint(name = "uk_chat_member_room_user", columnNames = {"chat_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_chat_member_room", columnList = "chat_id"),
                @Index(name = "idx_chat_member_user", columnList = "user_id")
        }
)
public class ChatMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;                         // 채팅 참여 멤버 ID

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;            // 참여시간

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "chat_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_chat_member_room")
    )
    private ChatRoom chat;                     // 참여한 채팅방

    /** chat_members.user_id (FK -> users.id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_chat_member_user"))
    private User user;
}
