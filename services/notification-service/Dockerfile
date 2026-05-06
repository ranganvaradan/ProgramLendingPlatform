FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY services/notification-service/pom.xml services/notification-service/pom.xml
COPY services/notification-service/src services/notification-service/src
RUN ./mvnw dependency:go-offline -q -pl services/notification-service
RUN ./mvnw package -DskipTests -q -pl services/notification-service
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S plp && adduser -S plp -G plp
USER plp
COPY --from=builder /build/services/notification-service/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
