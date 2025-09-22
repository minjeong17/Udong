package com.udong.backend.notification.service;

import com.udong.backend.notification.dto.NotificationRequest;
import com.udong.backend.notification.dto.NotificationResponse;
import com.udong.backend.notification.entity.Notification;
import com.udong.backend.notification.entity.NotificationDelivery;
import com.udong.backend.notification.repository.NotificationDeliveryRepository;
import com.udong.backend.notification.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationDeliveryRepository notificationDeliveryRepository;

    /**
     * 알림 생성 및 발송
     */
    public void createAndSendNotification(NotificationRequest request) {
        // 1. DTO -> Entity 변환 (Builder 사용으로 가독성 향상)
        Notification notification = Notification.builder()
                .payload(request.getPayload())
                .createdBy(request.getCreatedBy())
                .type(request.getType())
                .targetId(request.getTargetId())
                .build();
        notificationRepository.save(notification);

        // 2. 각 수신자에게 전달될 NotificationDelivery 엔티티 생성
        List<NotificationDelivery> deliveries = request.getRecipientUserIds().stream()
                .map(userId -> NotificationDelivery.builder()
                        .userId(userId)
                        .notification(notification)
                        .build()) // hasRead는 기본값 false이므로 명시할 필요 없음
                .toList();
        notificationDeliveryRepository.saveAll(deliveries);
    }

    /**
     * 유저별 받은 알림 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable) {
        Page<NotificationDelivery> deliveries = notificationDeliveryRepository.findByUserIdWithNotification(userId, pageable);

        // Entity Page -> DTO Page 변환
        return deliveries.map(this::convertToNotificationResponse);
    }

    /**
     * 단일 알림 읽음 처리
     */
    public void markAsRead(Long userId, Long notificationDeliveryId) {
        NotificationDelivery delivery = notificationDeliveryRepository.findByIdAndUserId(notificationDeliveryId, userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 알림을 찾을 수 없습니다. ID: " + notificationDeliveryId));

        delivery.read(); // Entity의 상태 변경 메소드 호출 -> Dirty Checking으로 DB 업데이트
    }

    /**
     * 해당 유저의 모든 알림 읽음 처리
     */
    public void markAllAsRead(Long userId) {
        notificationDeliveryRepository.readAllByUserId(userId);
    }

    /**
     * 단일 알림 삭제
     */
    public void deleteNotification(Long userId, Long notificationDeliveryId) {
        // deleteByIdAndUserId는 삭제된 행의 수를 반환합니다.
        long deletedCount = notificationDeliveryRepository.deleteByIdAndUserId(notificationDeliveryId, userId);

        // 삭제된 행이 0개라면, 해당 알림이 존재하지 않거나 본인의 알림이 아니라는 의미입니다.
        if (deletedCount == 0) {
            throw new EntityNotFoundException("해당 알림을 찾을 수 없거나 삭제할 권한이 없습니다. ID: " + notificationDeliveryId);
        }
    }

    /**
     * 읽은 알림 모두 삭제
     */
    public void deleteAllReadNotifications(Long userId) {
        notificationDeliveryRepository.deleteAllByUserIdAndHasReadIsTrue(userId);
    }

    /**
     * NotificationDelivery 엔티티를 NotificationResponse DTO로 변환하는 private 헬퍼 메소드
     */
    private NotificationResponse convertToNotificationResponse(NotificationDelivery delivery) {
        Notification notification = delivery.getNotification();
        return NotificationResponse.builder()
                .notificationDeliveryId(delivery.getId())
                .payload(notification.getPayload())
                .type(notification.getType())
                .targetId(notification.getTargetId())
                .hasRead(delivery.isHasRead())
                .createdAt(delivery.getCreatedAt())
                .build();
    }
}
