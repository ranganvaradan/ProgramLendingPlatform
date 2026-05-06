FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY services/integration-service/pom.xml services/integration-service/pom.xml
COPY services/integration-service/src services/integration-service/src
RUN ./mvnw dependency:go-offline -q -pl services/integration-service
RUN ./mvnw package -DskipTests -q -pl services/integration-service
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S plp && adduser -S plp -G plp
USER plp
COPY --from=builder /build/services/integration-service/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
