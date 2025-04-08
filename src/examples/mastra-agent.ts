import {
  RunAgent,
  BaseEvent,
  AbstractAgent,
  RunAgentInput,
  AgentConfig,
  RunStartedEvent,
  RunFinishedEvent,
  EventType,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  Message,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
} from "@agentwire/client";

import { v4 as uuidv4 } from "uuid";
import { Observable } from "rxjs";
import { MastraClient } from "@mastra/client-js";
import { CoreMessage } from "@mastra/core";

interface MastraAgentConfig extends AgentConfig {
  mastraClient?: MastraClient;
  agentId: string;
}

export class MastraAgent extends AbstractAgent {
  mastraClient: MastraClient;

  constructor(config: MastraAgentConfig) {
    super(config);
    this.mastraClient =
      config?.mastraClient ??
      new MastraClient({
        baseUrl: "http://localhost:4111",
      });
  }

  protected run(input: RunAgentInput): RunAgent {
    return () => {
      const agent = this.mastraClient.getAgent(this.agentId!);
      return new Observable<BaseEvent>((subscriber) => {
        console.log("tools", JSON.stringify(input.tools, null, 2));
        // Emit run started event
        subscriber.next({
          type: EventType.RUN_STARTED,
          threadId: input.threadId,
          runId: input.runId,
        } as RunStartedEvent);

        agent
          .stream({
            threadId: input.threadId,
            runId: input.runId,
            messages: convertMessagesToMastraMessages(input.messages),
          })
          .then((response) => {
            let currentMessageId: string | undefined = undefined;

            response.processDataStream({
              onTextPart: (text) => {
                if (currentMessageId === undefined) {
                  currentMessageId = uuidv4();

                  const message: TextMessageStartEvent = {
                    type: EventType.TEXT_MESSAGE_START,
                    messageId: currentMessageId,
                    role: "assistant",
                  };
                  subscriber.next(message);
                }

                const message: TextMessageContentEvent = {
                  type: EventType.TEXT_MESSAGE_CONTENT,
                  messageId: currentMessageId,
                  delta: text,
                };
                subscriber.next(message);
              },
              onFinishMessagePart: (message) => {
                console.log("onFinishMessagePart", message);
                if (currentMessageId !== undefined) {
                  const message: TextMessageEndEvent = {
                    type: EventType.TEXT_MESSAGE_END,
                    messageId: currentMessageId,
                  };
                  subscriber.next(message);
                }
                // Emit run finished event
                subscriber.next({
                  type: EventType.RUN_FINISHED,
                  threadId: input.threadId,
                  runId: input.runId,
                } as RunFinishedEvent);

                // Complete the observable
                subscriber.complete();
              },
              onToolCallPart(streamPart) {
                subscriber.next({
                  type: EventType.TOOL_CALL_START,
                  toolCallId: streamPart.toolCallId,
                  toolCallName: streamPart.toolName,
                } as ToolCallStartEvent);

                subscriber.next({
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId: streamPart.toolCallId,
                  delta: JSON.stringify(streamPart.args),
                } as ToolCallArgsEvent);

                subscriber.next({
                  type: EventType.TOOL_CALL_END,
                  toolCallId: streamPart.toolCallId,
                } as ToolCallEndEvent);
              },
              onToolCallDeltaPart(streamPart) {
                console.log("onToolCallDeltaPart", streamPart);
              },
              onToolCallStreamingStartPart(streamPart) {
                console.log("onToolCallStreamingStartPart", streamPart);
              },
              onToolResultPart(streamPart) {
                console.log("onToolResultPart", streamPart);
              },
            });
          })
          .catch((error) => {
            // Handle error
            subscriber.error(error);
          });

        // Return unsubscribe function
        return () => {
          // Cleanup logic if needed
        };
      });
    };
  }
}

function convertMessagesToMastraMessages(messages: Message[]): CoreMessage[] {
  const result: CoreMessage[] = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      result.push({
        role: "assistant",
        content: message.content || "",
      });
    } else if (message.role === "user") {
      result.push({
        role: "user",
        content: message.content || "",
      });
    } else if (message.role === "tool") {
      result.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: message.toolCallId,
            toolName: "unknown",
            result: message.content,
          },
        ],
      });
    }
  }

  return result;
}
