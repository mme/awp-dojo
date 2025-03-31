import { HttpAgent } from "@agentwire/client";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest } from "next/server";

const agenticChat = new HttpAgent({
  url: "http://localhost:3000/api/sse/agentic_chat",
});

const runtime = new CopilotRuntime({
  agents: { agenticChat },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new OpenAIAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
