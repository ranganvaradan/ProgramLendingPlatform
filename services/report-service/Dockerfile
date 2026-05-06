FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY services/report-service/pom.xml services/report-service/pom.xml
COPY services/report-service/src services/report-service/src
RUN ./mvnw dependency:go-offline -q -pl services/report-service
RUN ./mvnw package -DskipTests -q -pl services/report-service
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S plp && adduser -S plp -G plp
USER plp
COPY --from=builder /build/services/report-service/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
