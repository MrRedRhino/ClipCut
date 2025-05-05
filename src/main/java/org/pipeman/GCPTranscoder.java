package org.pipeman;

import com.google.cloud.video.transcoder.v1.*;
import com.google.protobuf.Duration;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;

public class GCPTranscoder {
    private static final Logger LOGGER = LoggerFactory.getLogger(GCPTranscoder.class);
    private static final TranscoderServiceClient transcoderClient;

    static {
        try {
            transcoderClient = TranscoderServiceClient.create();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void createTranscodeJob(Context ctx) {
        String file = ctx.pathParam("file");

        CreateTranscodeJobPayload payload = ctx.bodyAsClass(CreateTranscodeJobPayload.class);
        if (payload.bitrate == null)
            throw new BadRequestResponse("Missing 'bitrate'");

        if (!GCPStorage.exists(file)) throw new BadRequestResponse("File not found");

        EditAtom.Builder atomBuilder = EditAtom.newBuilder()
                .setKey("atom0")
                .addInputs("input0");

        if (payload.startTime != null)
            atomBuilder.setStartTimeOffset(Duration.newBuilder().setNanos((int) (payload.startTime / 1_000_000)));
        if (payload.endTime != null)
            atomBuilder.setEndTimeOffset(Duration.newBuilder().setNanos((int) (payload.endTime / 1_000_000)));

        VideoStream.H264CodecSettings.Builder codecSettings = VideoStream.H264CodecSettings.newBuilder()
                .setBitrateBps(payload.bitrate)
                .setFrameRate(30)
                .setWidthPixels(1280)
                .setHeightPixels(720);

        if (payload.frameRate != null)
            codecSettings.setFrameRate(payload.frameRate);

        JobConfig config = JobConfig.newBuilder()
                .addInputs(Input.newBuilder().setKey("input0").setUri(GCPStorage.getObjectUri(file)))
                .addEditList(atomBuilder)
                .addElementaryStreams(ElementaryStream.newBuilder()
                        .setKey("video-stream0")
                        .setVideoStream(VideoStream.newBuilder().setH264(codecSettings))
                )
                .addElementaryStreams(ElementaryStream.newBuilder()
                        .setKey("audio-stream0")
                        .setAudioStream(AudioStream.newBuilder()
                                .setCodec("aac")
                                .setBitrateBps(64_000)
                                .build())
                )
                .addMuxStreams(MuxStream.newBuilder()
                        .setKey(file)
                        .setContainer("mp4")
                        .addElementaryStreams("video-stream0")
                        .addElementaryStreams("audio-stream0")
                        .build())
                .build();

        Job job = Job.newBuilder()
                .setOutputUri("gs://pipehub-1/processed/")
                .setConfig(config)
                .build();

        Job createdJob = transcoderClient.createJob(LocationName.format("starlit-myth-402020", "europe-west1"), job);
        ctx.json(Map.of("job", createdJob.getName()));

//        while (true) {
//            Job.ProcessingState state = transcoderClient.getJob(createdJob.getName()).getState();
//            if (state == Job.ProcessingState.SUCCEEDED) break;
//            System.out.println(state);
//            Thread.sleep(1000);
//        }
        LOGGER.info("Transcode job created: {}", createdJob.getName());
    }

    public static void getJobStatus(Context ctx) {
        String jobName = ctx.queryParamAsClass("job", String.class).get();

        Job job = transcoderClient.getJob(jobName);

        String fileName = "processed/" + job.getConfig().getMuxStreams(0).getKey() + ".mp4";
        boolean done = job.getState() == Job.ProcessingState.SUCCEEDED;

        ctx.json(new JobStatus(done, done ? GCPStorage.getDownloadUrl(fileName) : null));
    }

    private record CreateTranscodeJobPayload(Float startTime, Float endTime, Integer bitrate, Float frameRate) {
    }

    private record JobStatus(boolean done, String url) {
    }
}
