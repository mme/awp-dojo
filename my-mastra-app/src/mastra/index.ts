import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";

import { agenticChatAgent } from "./agents";

export const mastra = new Mastra({
  agents: { agenticChatAgent },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
