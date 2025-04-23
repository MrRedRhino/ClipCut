package org.pipeman;

import io.javalin.Javalin;
import io.javalin.json.JavalinGson;

import static io.javalin.apibuilder.ApiBuilder.*;

public class WebServer {
    public static void main(String[] args) {
        Javalin.create(c -> {
            c.showJavalinBanner = false;
            c.jsonMapper(new JavalinGson());

            c.router.apiBuilder(() -> {
                path("api", () -> {
                    get("upload-url", GCPStorage::generateUploadUrl);
                    post("compress/{file}", GCPTranscoder::createTranscodeJob);
                    get("status", GCPTranscoder::getJobStatus);
                });
            });
        }).start();
    }
}
