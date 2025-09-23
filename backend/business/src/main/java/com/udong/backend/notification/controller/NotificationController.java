package com.udong.backend.notification.controller;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.notification.dto.NotificationRequest;
import com.udong.backend.notification.dto.NotificationResponse;
import com.udong.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    /**
     * 알림 생성 (다른 서비스에서 내부적으로 호출)
     * POST /api/v1/notifications
     */
    @PostMapping("/notifications")
    public ResponseEntity<ApiResponse<String>> createNotification(@RequestBody NotificationRequest request) {
        notificationService.createAndSendNotification(request);
        return ResponseEntity.ok(ApiResponse.ok("알림이 성공적으로 생성되었습니다."));
    }

    /**
     * 유저별 받은 알림 조회 (타입 필터링 지원)
     * GET /api/v1/me/notifications?clubId={clubId}&type={type}
     */
    @GetMapping("/me/notifications")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @RequestParam Long clubId,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Long currentUserId = securityUtils.currentUserId().longValue();
        Page<NotificationResponse> response = notificationService.getNotificationsForUser(currentUserId, clubId, type, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * 내 미읽음 알림 총 개수 조회
     * GET /api/v1/me/notifications/unread-count?clubId={clubId}
     */
    @GetMapping("/me/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(@RequestParam Long clubId) {
        Long currentUserId = securityUtils.currentUserId().longValue();
        Long unreadCount = notificationService.getUnreadNotificationCount(currentUserId, clubId);
        return ResponseEntity.ok(ApiResponse.ok(unreadCount));
    }

    /**
     * 알림 읽음 표시
     * PUT /api/v1/me/notifications/{notificationId}
     */
    @PutMapping("/me/notifications/{notificationId}")
    public ResponseEntity<ApiResponse<String>> readNotification(
            @PathVariable("notificationId") Long notificationDeliveryId) {

        Long currentUserId = securityUtils.currentUserId().longValue();
        notificationService.markAsRead(currentUserId, notificationDeliveryId);

        return ResponseEntity.ok(ApiResponse.ok("알림을 읽음 처리했습니다."));
    }

    /**
     * 모든 알림 읽음 처리
     * PATCH /api/v1/notifications/read-all?clubId={clubId}
     */
    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<String>> readAllNotifications(@RequestParam Long clubId) {

        Long currentUserId = securityUtils.currentUserId().longValue();
        notificationService.markAllAsRead(currentUserId, clubId);

        return ResponseEntity.ok(ApiResponse.ok("모든 알림을 읽음 처리했습니다."));
    }

    /**
     * 단일 알림 삭제
     * DELETE /api/v1/me/notifications/{notificationId}
     */
    @DeleteMapping("/me/notifications/{notificationId}")
    public ResponseEntity<ApiResponse<String>> deleteNotification(
            @PathVariable("notificationId") Long notificationDeliveryId) {

        Long currentUserId = securityUtils.currentUserId().longValue();
        notificationService.deleteNotification(currentUserId, notificationDeliveryId);

        return ResponseEntity.ok(ApiResponse.ok("알림을 성공적으로 삭제했습니다."));
    }

    /**
     * 읽은 알림 모두 삭제
     * DELETE /api/v1/me/notifications/read?clubId={clubId}
     */
    @DeleteMapping("/me/notifications/read")
    public ResponseEntity<ApiResponse<String>> deleteAllReadNotifications(@RequestParam Long clubId) {

        Long currentUserId = securityUtils.currentUserId().longValue();
        notificationService.deleteAllReadNotifications(currentUserId, clubId);

        return ResponseEntity.ok(ApiResponse.ok("읽은 알림을 모두 삭제했습니다."));
    }
}
