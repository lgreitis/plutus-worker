import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify from "fastify";

const fastifyConfig = async () => {
  const server = fastify({
    logger: {
      transport: {
        target: "@fastify/one-line-logger",
        options: {
          colorize: true,
        },
      },
    },
  });

  await server.register(fastifySwagger, {
    mode: "dynamic",
    openapi: {
      info: {
        title: "String",
        description: "String",
        version: "String",
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
  });

  return server;
};

export default fastifyConfig;
