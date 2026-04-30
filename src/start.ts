import { createStart } from "@tanstack/react-start";
import { securityHeadersMiddleware } from "@/server/security-headers";

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
}));
