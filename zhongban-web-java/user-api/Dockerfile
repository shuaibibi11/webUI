FROM eclipse-temurin:17-jre as runtime
WORKDIR /app
COPY target/user-api-*.jar app.jar
EXPOSE 11031
ENTRYPOINT ["java", \
    "-Xms512m", \
    "-Xmx2g", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:+UseStringDeduplication", \
    "-XX:+HeapDumpOnOutOfMemoryError", \
    "-XX:HeapDumpPath=/app/heapdump.hprof", \
    "-Dserver.tomcat.max-threads=200", \
    "-Dserver.tomcat.min-spare-threads=20", \
    "-Dserver.tomcat.accept-count=100", \
    "-Dserver.tomcat.max-connections=10000", \
    "-jar", "/app/app.jar"]
