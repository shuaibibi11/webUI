FROM eclipse-temurin:17-jre as runtime
WORKDIR /app
COPY target/admin-api-*.jar app.jar
EXPOSE 11025
ENTRYPOINT ["java", \
    "-Xms256m", \
    "-Xmx1g", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:+UseStringDeduplication", \
    "-XX:+HeapDumpOnOutOfMemoryError", \
    "-XX:HeapDumpPath=/app/heapdump.hprof", \
    "-Dserver.tomcat.max-threads=100", \
    "-Dserver.tomcat.min-spare-threads=10", \
    "-jar", "/app/app.jar"]
