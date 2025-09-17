package com.udong.backend.users.service;

import com.udong.backend.users.dto.SignUpRequest;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.entity.UserAvailability;
import com.udong.backend.users.repository.UserRepository;
import com.udong.backend.global.util.AesUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AesUtil aesUtil;

    @Transactional
    public void signUp(SignUpRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .university(req.getUniversity())
                .major(req.getMajor())
                .residence(req.getResidence())
                .phone(req.getPhone())
                .gender(User.Gender.valueOf(req.getGender())) // "M"/"F"만 허용
                .accountHash(aesUtil.encrypt(req.getAccount()))
                .build();

        // 가능 시간 같이 들어오면 추가
        if (req.getAvailability() != null) {
            for (var a : req.getAvailability()) {
                UserAvailability ua = UserAvailability.builder()
                        .dayOfWeek(a.getDayOfWeek())
                        .startTime(LocalTime.parse(a.getStartTime()))
                        .endTime(LocalTime.parse(a.getEndTime()))
                        .build();
                user.addAvailability(ua); // 양방향 세팅 (cascade로 함께 저장)
            }
        }

        User saved = userRepository.save(user);
//        return new SignUpResponse(saved.getId(), saved.getEmail(), saved.getName());
    }

    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        // JPA cascade/orphanRemoval이 먹도록 '엔티티 삭제'로 처리
        userRepository.delete(user);
    }
}
