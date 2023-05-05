import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from "fastify";
import { SECRET_KEY } from "src/constants";

export const sharedSecretHeaderHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: DoneFuncWithErrOrRes
) => {
  if (
    request.headers.authorization &&
    request.headers.authorization === SECRET_KEY
  ) {
    done();
  } else {
    reply.status(403);
    done(new Error("Forbidden"));
  }
};
