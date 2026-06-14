FROM eclipse-temurin:25-jdk

WORKDIR /app

COPY backend/gradle ./gradle
COPY backend/gradlew backend/settings.gradle.kts backend/build.gradle.kts ./
RUN ./gradlew --version

COPY backend/src ./src

EXPOSE 8080

CMD ["./gradlew", "bootRun", "--no-daemon"]
