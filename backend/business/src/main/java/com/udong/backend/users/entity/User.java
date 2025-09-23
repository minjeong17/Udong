package com.udong.backend.users.entity;

import com.udong.backend.auth.entity.RefreshToken;

import com.udong.backend.calendar.entity.Event;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "users", indexes = {
        @Index(name = "uk_users_email", columnList = "email", unique = true)
})
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") // INT AUTO_INCREMENT
    private Integer id;

    @Column(name = "email", nullable = false, length = 100, unique = true)
    private String email;

    // BCrypt 해시(60자)
    @Column(name = "password_hash", nullable = false, length = 60)
    private String passwordHash;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "university", length = 30)
    private String university;

    @Column(name = "major", length = 60)
    private String major;

    @Column(name = "residence", length = 60)
    private String residence;

    @Column(name = "phone", length = 13)
    private String phone;

    @Column(name = "account_cipher", length = 1024)
    private String accountCipher;

    @Column(name = "account_key_ver", nullable = false)
    private short accountKeyVer;

    // === 금융망 userKey (암호화 저장) ===
    @Column(name = "user_key_cipher", length = 1024)
    private String userKeyCipher;       // 평문 getter/setter로 접근하면 컨버터가 자동 암/복호

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 50) // "M" / "F"
    private Gender gender;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ===== 연관관계 매핑 (1:N) =====
    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,       // 회원 저장 시 가능시간도 함께 저장/삭제하려면 ALL
            orphanRemoval = true,            // 리스트에서 제거 시 자식 레코드 삭제
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<UserAvailability> availabilities = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private RefreshToken refreshToken;

    // 양방향 편의 메서드
    public void addAvailability(UserAvailability availability) {
        availabilities.add(availability);
        availability.setUser(this);
    }

    public void removeAvailability(UserAvailability availability) {
        availabilities.remove(availability);
        availability.setUser(null);
    }

    public void updateAccount(String accountCipher, short accountKeyVer) {
        this.accountCipher = accountCipher;
        this.accountKeyVer = accountKeyVer;
    }

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Event> createdEvents = new ArrayList<>();

    // 편의 메서드
    public void addCreatedEvent(Event event) {
        createdEvents.add(event);
        event.setCreatedBy(this);
    }

    public void removeCreatedEvent(Event event) {
        createdEvents.remove(event);
        event.setCreatedBy(null);
    }


    public enum Gender { M, F }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                ", phone='" + phone + '\'' +
                ", gender=" + gender +
                '}';
    }
}
