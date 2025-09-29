package com.udong.backend.mypage.repository;

import com.udong.backend.users.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/** 사용자 기본 프로필 전용 */
public interface MyPageUserRepository extends Repository<User, Integer> {

    interface UserProfileProj {
        String getName();
        String getEmail();
        String getPhone();
        String getUniversity();
        String getMajor();
        String getGender();
        String getAccountCipher();   // getter 형태로!
    }

    @Query(value = """
        SELECT u.name            AS name,
               u.email           AS email,
               u.phone           AS phone,
               u.university      AS university,
               u.major           AS major,
               u.gender          AS gender,
               u.account_cipher  AS accountCipher
        FROM users u
        WHERE u.id = :userId
        """, nativeQuery = true)
    Optional<UserProfileProj> findUserProfile(@Param("userId") Integer userId);
}
