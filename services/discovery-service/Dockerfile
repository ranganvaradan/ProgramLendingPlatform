FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY mvnw .
RUN chmod +x mvnw
COPY .mvn .mvn
COPY pom.xml .
COPY services/discovery-service/pom.xml services/discovery-service/pom.xml
COPY services/discovery-service/src services/discovery-service/src
RUN ./mvnw dependency:go-offline -q -pl services/discovery-service
RUN ./mvnw package -DskipTests -q -pl services/discovery-service
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S plp && adduser -S plp -G plp
USER plp
COPY --from=builder /build/services/discovery-service/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
