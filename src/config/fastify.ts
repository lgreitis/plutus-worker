import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify from "fastify";

export const fastifyServer = fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger",
      options: {
        colorize: true,
      },
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>();

const fastifyConfig = async () => {
  await fastifyServer.register(fastifySwagger, {
    mode: "dynamic",
    openapi: {
      info: {
        title: "String",
        description: "String",
        version: "String",
      },
    },
  });

  await fastifyServer.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
  });

  return fastifyServer;
};

export default fastifyConfig;
