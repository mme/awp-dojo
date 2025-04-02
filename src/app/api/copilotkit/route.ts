import { CustomHttpAgent } from "@/custom-http-agent";

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest } from "next/server";

const BASE_URL = "http://localhost:3000";

const agenticChatAgent = new CustomHttpAgent({
  url: `${BASE_URL}/api/sse/agentic_chat_mock`,
});

const agentiveGenerativeUIAgent = new CustomHttpAgent({
  url: `${BASE_URL}/api/sse/agentive_generative_ui_mock`,
});

const humanInTheLoopAgent = new CustomHttpAgent({
  url: `${BASE_URL}/api/sse/human_in_the_loop_mock`,
});

const predictiveStateUpdatesAgent = new CustomHttpAgent({
  url: `${BASE_URL}/api/sse/predictive_state_updates_mock`,
});

const sharedStateAgent = new CustomHttpAgent({
  url: `${BASE_URL}/api/sse/shared_state_mock`,
});

const toolBasedGenerativeUIAgent = new CustomHttpAgent({
  url: `${BASE_URL}/api/sse/tool_based_generative_ui_mock`,
});

const runtime = new CopilotRuntime({
  agents: {
    agenticChatAgent,
    agentiveGenerativeUIAgent,
    humanInTheLoopAgent,
    predictiveStateUpdatesAgent,
    sharedStateAgent,
    toolBasedGenerativeUIAgent,
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
