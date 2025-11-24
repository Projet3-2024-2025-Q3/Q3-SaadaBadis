# ------------------------------
# 1) Build Stage
# ------------------------------
FROM gradle:8.7-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test

# ------------------------------
# 2) Run Stage
# ------------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port (Render uses $PORT)
EXPOSE 8080

# Start Spring Boot
CMD ["sh", "-c", "java -Dserver.port=$PORT -jar app.jar"]
