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
        name = "chat_messages",
        indexes = {
                @Index(name = "idx_chat_msg_room", columnList = "chat_id"),
                @Index(name = "idx_chat_msg_created", columnList = "created_at")
        }
)
public class ChatMessage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;                 // 채팅메시지ID

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;    // 생성일시

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chat_msg_room"))
    private ChatRoom chat;              // 채팅방

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chat_msg_sender"))
    private User sender;                // 보낸 사람

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;             // 내용 (TEXT)

    // 필요 시 투표/시스템메시지 등 확장 칼럼을 여기 추가
}
