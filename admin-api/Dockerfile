FROM eclipse-temurin:17-jre as runtime
WORKDIR /app
COPY target/admin-api-*.jar app.jar
EXPOSE 11025
ENTRYPOINT ["java","-jar","/app/app.jar"]
