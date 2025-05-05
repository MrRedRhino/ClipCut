package org.pipeman;

import com.google.cloud.storage.*;
import io.javalin.http.Context;

import java.net.URL;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class GCPStorage {
    private static final String bucket = "pipehub-1";
    private static final Storage storageService = StorageOptions.getDefaultInstance().getService();

    private static URL generateSignedUploadUrl(String filename) {
        BlobInfo blobInfo = BlobInfo.newBuilder(bucket, filename).build();

        PostPolicyV4.PostConditionsV4 conditions = PostPolicyV4.PostConditionsV4.newBuilder()
                .addContentLengthRangeCondition(0, 500_000_000)
                .build();

//        PostPolicyV4 policy = storageService.generateSignedPostPolicyV4(blobInfo, 1, TimeUnit.HOURS, conditions);
//        HashMap<String, String> headers = new HashMap<>(policy.getFields());
//        headers.put("Content-Type", "application/octet-stream");

        return storageService.signUrl(blobInfo, 1, TimeUnit.HOURS,
//                Storage.SignUrlOption.withQueryParams(headers),
                Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                Storage.SignUrlOption.withV4Signature());
    }

    public static boolean exists(String file) {
        return storageService.get(bucket, file) != null;
    }

    public static String getObjectUri(String file) {
        return "gs://" + bucket + "/" + file;
    }

    public static String getDownloadUrl(String file) {
        return "https://storage.googleapis.com/" + bucket + "/" + file;
    }

    public static void generateUploadUrl(Context ctx) {
        String filename = UUID.randomUUID().toString();
        URL url = generateSignedUploadUrl(filename);
        ctx.json(Map.of(
                "url", url,
                "fileId", filename,
                "downloadUrl", getDownloadUrl(filename)
        ));
    }
}
