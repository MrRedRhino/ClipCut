FROM maven AS build_java
COPY pom.xml .
COPY src src
RUN mvn -f pom.xml package

FROM azul/zulu-openjdk:21-latest
COPY --from=build_java target/clip_cut.jar clip_cut.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "clip_cut.jar"]
