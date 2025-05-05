FROM maven AS build_java
COPY pom.xml .
COPY src src
RUN mvn -f pom.xml clean compile assembly:single

FROM azul/zulu-openjdk:21-latest
COPY --from=build_java target/clip_cut-jar-with-dependencies.jar clip_cut.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "clip_cut.jar"]
