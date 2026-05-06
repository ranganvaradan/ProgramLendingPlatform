FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY services/api-gateway/pom.xml services/api-gateway/pom.xml
COPY services/api-gateway/src services/api-gateway/src
RUN ./mvnw dependency:go-offline -q -pl services/api-gateway
RUN ./mvnw package -DskipTests -q -pl services/api-gateway
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S plp && adduser -S plp -G plp
USER plp
COPY --from=builder /build/services/api-gateway/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
