FROM eclipse-temurin:17-jre as runtime
WORKDIR /app
COPY target/user-api-*.jar app.jar
EXPOSE 11020
ENTRYPOINT ["java","-jar","/app/app.jar"]
