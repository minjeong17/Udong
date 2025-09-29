package com.udong.backend.chat.entity;

import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "chat_rooms",
        uniqueConstraints = {
                // 같은 대상(type, target_id)에는 방 하나만
                @UniqueConstraint(name = "uk_room_type_target", columnNames = {"type", "target_id"})
        },
        indexes = {
                @Index(name = "idx_room_type_target", columnList = "type,target_id"),
                @Index(name = "idx_room_created_by", columnList = "created_by")
        }
)
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;                     // 채팅방ID (INT)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;        // 생성일시

    /** 채팅방 생성자: chatting_rooms.created_by (FK -> users.id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_chat_room_creator"))
    private User createdBy;

    @Column(name = "name", length = 100, nullable = false)
    private String name;                    // 채팅방 이름

    /**
     * 채팅방 유형: GLOBAL | EVENT
     * ERD상 chatting_rooms.type (VARCHAR) -> code_detail.code_name (PK) 참조
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "type",
            referencedColumnName = "code_name",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_chat_room_type")
    )
    private CodeDetail type;

    /**
     * type=GLOBAL -> club_id, type=EVENT -> event_id
     * 다형 FK이므로 서비스에서 유효성 검증 필요
     */
    @Column(name = "target_id", nullable = false)
    private Integer targetId;

    @Column(name = "participants_confirmed", nullable = false)
    private boolean participantsConfirmed = false;

    @Column(name = "participants_confirmed_count")
    private Integer participantsConfirmedCount;

    /**
     * 채팅방에 속한 멤버들 (Cascade + orphanRemoval 적용)
     */
    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMember> members = new ArrayList<>();

    /**
     * 채팅방에 속한 메시지들 (Cascade + orphanRemoval 적용)
     */
    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> messages = new ArrayList<>();

    public void confirmParticipants(int count) {
        this.participantsConfirmed = true;
        this.participantsConfirmedCount = count;
    }

}
