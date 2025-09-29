# 빌드 단계
FROM openjdk:21-jdk-slim AS builder

WORKDIR /app

# Gradle wrapper 및 빌드 설정 파일 복사
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle .
COPY settings.gradle .

# gradlew 실행 권한 부여
RUN chmod +x gradlew

# 소스 코드 복사
COPY src/ src/

# 애플리케이션 빌드
RUN ./gradlew bootJar --no-daemon

# 런타임 단계
FROM openjdk:21-jdk-slim

WORKDIR /app

# 빌드 단계에서 생성된 JAR 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 보안을 위한 비-root 사용자 생성
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
