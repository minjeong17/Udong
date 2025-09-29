package com.udong.backend.notification.repository;

import com.udong.backend.notification.entity.NotificationDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, Long> {

    // 특정 유저가 받은 알림 목록을 안읽음 우선, 최신순으로 페이징 조회
    // Fetch Join을 통해 N+1 문제 해결
    @Query("SELECT nd FROM NotificationDelivery nd JOIN FETCH nd.notification n WHERE nd.userId = :userId ORDER BY nd.hasRead ASC, nd.createdAt DESC")
    Page<NotificationDelivery> findByUserIdWithNotification(@Param("userId") Long userId, Pageable pageable);

    // 특정 동아리의 특정 유저가 받은 알림 목록을 안읽음 우선, 최신순으로 페이징 조회
    @Query("SELECT nd FROM NotificationDelivery nd JOIN FETCH nd.notification n WHERE nd.userId = :userId AND n.clubId = :clubId ORDER BY nd.hasRead ASC, nd.createdAt DESC")
    Page<NotificationDelivery> findByUserIdAndClubIdWithNotification(@Param("userId") Long userId, @Param("clubId") Long clubId, Pageable pageable);

    // 특정 유저가 받은 특정 타입의 알림 목록을 안읽음 우선, 최신순으로 페이징 조회
    @Query("SELECT nd FROM NotificationDelivery nd JOIN FETCH nd.notification n WHERE nd.userId = :userId AND n.type = :type ORDER BY nd.hasRead ASC, nd.createdAt DESC")
    Page<NotificationDelivery> findByUserIdAndNotificationTypeWithNotification(@Param("userId") Long userId, @Param("type") String type, Pageable pageable);

    // 특정 동아리의 특정 유저가 받은 특정 타입의 알림 목록을 안읽음 우선, 최신순으로 페이징 조회
    @Query("SELECT nd FROM NotificationDelivery nd JOIN FETCH nd.notification n WHERE nd.userId = :userId AND n.clubId = :clubId AND n.type = :type ORDER BY nd.hasRead ASC, nd.createdAt DESC")
    Page<NotificationDelivery> findByUserIdAndClubIdAndNotificationTypeWithNotification(@Param("userId") Long userId, @Param("clubId") Long clubId, @Param("type") String type, Pageable pageable);

    // 특정 유저의 특정 알림을 찾기 위함 (읽음 처리시 사용)
    Optional<NotificationDelivery> findByIdAndUserId(Long id, Long userId);

    // 특정 유저의 모든 읽지 않은 알림을 찾기 위함 (전체 읽음 처리시 사용)
    List<NotificationDelivery> findAllByUserIdAndHasReadIsFalse(Long userId);

    // JPQL을 이용한 벌크 업데이트 (전체 읽음 처리 성능 최적화)
    @Modifying(clearAutomatically = true)
    @Query("UPDATE NotificationDelivery nd SET nd.hasRead = true WHERE nd.userId = :userId AND nd.hasRead = false")
    int readAllByUserId(@Param("userId") Long userId);

    // 특정 동아리의 모든 알림 읽음 처리
    @Modifying(clearAutomatically = true)
    @Query("UPDATE NotificationDelivery nd SET nd.hasRead = true WHERE nd.userId = :userId AND nd.notification.clubId = :clubId AND nd.hasRead = false")
    int readAllByUserIdAndClubId(@Param("userId") Long userId, @Param("clubId") Long clubId);

    // 읽지 않은 알림 개수 조회
    long countByUserIdAndHasReadIsFalse(Long userId);

    // 특정 동아리의 읽지 않은 알림 개수 조회
    @Query("SELECT COUNT(nd) FROM NotificationDelivery nd JOIN nd.notification n WHERE nd.userId = :userId AND n.clubId = :clubId AND nd.hasRead = false")
    long countByUserIdAndClubIdAndHasReadIsFalse(@Param("userId") Long userId, @Param("clubId") Long clubId);

    // 특정 유저의 특정 알림을 ID로 삭제
    // long을 반환하여 실제로 몇 개의 행이 삭제되었는지 확인할 수 있습니다.
    long deleteByIdAndUserId(Long id, Long userId);

    // 특정 유저의 읽은 알림을 모두 삭제 (벌크 연산)
    @Modifying
    @Query("DELETE FROM NotificationDelivery nd WHERE nd.userId = :userId AND nd.hasRead = true")
    void deleteAllByUserIdAndHasReadIsTrue(@Param("userId") Long userId);

    // 특정 동아리의 읽은 알림을 모두 삭제 (벌크 연산)
    @Modifying
    @Query("DELETE FROM NotificationDelivery nd WHERE nd.userId = :userId AND nd.notification.clubId = :clubId AND nd.hasRead = true")
    void deleteAllByUserIdAndClubIdAndHasReadIsTrue(@Param("userId") Long userId, @Param("clubId") Long clubId);
}
