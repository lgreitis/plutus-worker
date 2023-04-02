import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginCallback } from "fastify";
import { inventoryFetchPool } from "src/config/bullmq";
import { sharedSecretHook } from "src/utils/sharedSecretHook";

const inventoryFetchBody = Type.Object({
  steamId: Type.String(),
  userId: Type.String(),
  secret: Type.String(),
});

type inventoryFetchBodyType = Static<typeof inventoryFetchBody>;

const inventoryFetchResponse = Type.Object({
  success: Type.Boolean(),
  jobId: Type.String(),
});

type inventoryFetchResponseType = Static<typeof inventoryFetchResponse>;

const inventoryStatusBody = Type.Object({
  jobId: Type.String(),
  secret: Type.String(),
});

type inventoryStatusBodyType = Static<typeof inventoryStatusBody>;

const inventoryStatusResponse = Type.Object({
  isDone: Type.Boolean(),
  jobFailed: Type.Boolean(),
  progress: Type.Number(),
  success: Type.Boolean(),
});

type inventoryStatusResponseType = Static<typeof inventoryStatusResponse>;

const inventoryFetchController: FastifyPluginCallback = (
  fastify,
  options,
  done
) => {
  fastify.route<{
    Body: inventoryFetchBodyType;
    Reply: inventoryFetchResponseType;
  }>({
    method: "POST",
    url: "/inventoryFetch",
    schema: {
      description: "Start inventory fetcher for user",
      body: inventoryFetchBody,
      response: {
        200: inventoryFetchResponse,
      },
    },
    preHandler: sharedSecretHook,
    handler: async (request, reply) => {
      try {
        const job = await inventoryFetchPool.add(
          `Fetch inventory`,
          {
            ...request.body,
          },
          { attempts: 10 }
        );

        if (!job.id) {
          reply.status(500).send({ success: false, jobId: "" });
          return;
        }

        reply.status(200).send({ success: true, jobId: job.id });
      } catch {
        reply.status(500).send({ success: false, jobId: "" });
      }
    },
  });

  fastify.route<{
    Body: inventoryStatusBodyType;
    Reply: inventoryStatusResponseType;
  }>({
    method: "POST",
    url: "/inventoryFetchStatus",
    schema: {
      description: "Check status of inventory fetch",
      body: inventoryStatusBody,
      response: {
        200: inventoryStatusResponse,
      },
    },
    preHandler: sharedSecretHook,
    handler: async (request, reply) => {
      try {
        const job = await inventoryFetchPool.getJob(request.body.jobId);

        if (!job) {
          return reply.status(400).send({
            success: false,
            isDone: false,
            jobFailed: false,
            progress: 0,
          });
        }

        const isDone = await job.isCompleted();
        const jobFailed = await job.isFailed();
        const progress = job.progress as number;

        reply.status(200).send({
          isDone,
          jobFailed,
          progress,
          success: true,
        });
      } catch {
        reply.status(200).send({
          success: false,
          isDone: false,
          jobFailed: false,
          progress: 0,
        });
      }
    },
  });

  done();
};

export default inventoryFetchController;
