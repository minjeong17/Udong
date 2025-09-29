#!/bin/bash

# 설정 - 여기만 본인 것으로 바꾸세요!
S3_BUCKET="ssafy-udong-project-mysql-backup"  # ← 방금 만든 버킷 이름

# 백업 실행
echo "백업 시작..."
DATE=$(TZ=Asia/Seoul date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql.gz"

# MySQL 백업하면서 바로 압축하고 S3에 업로드
mysqldump -h ssafy-mysql-db.mysql.database.azure.com \
          -P 3306 \
          -u S13P21A310 \
          -p1234 \
          --single-transaction \
          --routines \
          --triggers \
          --no-tablespaces \
          --skip-lock-tables \
          --set-gtid-purged=OFF \
          S13P21A310 | gzip | aws s3 cp - s3://$S3_BUCKET/$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "백업 성공! S3에 저장됨: s3://$S3_BUCKET/$BACKUP_FILE"
    
    # 백업 파일 목록 보기
    echo "현재 S3 백업 파일들:"
    aws s3 ls s3://$S3_BUCKET/ --human-readable
else
    echo "백업 실패!"
fi
