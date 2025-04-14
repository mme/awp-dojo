import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const changeBackgroundTool = createTool({
  id: "changeBackground",
  description:
    "Change the background color of the chat. Can be anything that the CSS background attribute accepts. Regular colors, linear of radial gradients etc.",
  inputSchema: z.object({
    background: z.string().describe("The background. Prefer gradients."),
  }),
});
