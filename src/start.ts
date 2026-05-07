import { createStart } from "@tanstack/react-start";
import { requestLoggerMiddleware } from "#/lib/request-logger";

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggerMiddleware],
}));
