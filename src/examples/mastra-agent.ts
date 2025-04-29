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
  resourceId?: string;
}

export class MastraAgent extends AbstractAgent {
  mastraClient: MastraClient;
  resourceId?: string;
  constructor(config?: MastraAgentConfig) {
    super(config);
    this.resourceId = config?.resourceId;

    this.mastraClient =
      config?.mastraClient ??
      new MastraClient({
        baseUrl: "http://localhost:4111",
      });
  }

  protected run(input: RunAgentInput): Observable<BaseEvent> {
    const agentId = this.agentId ?? uuidv4();
    const agent = this.mastraClient.getAgent(agentId);

    return new Observable<BaseEvent>((subscriber) => {
      const convertedMessages = convertMessagesToMastraMessages(input.messages);

      subscriber.next({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
      } as RunStartedEvent);

      agent
        .stream({
          threadId: input.threadId,
          resourceId: this.resourceId ?? agentId,
          runId: input.runId,
          messages: convertedMessages,
          clientTools: input.tools.reduce((acc, tool) => {
            acc[tool.name as string] = {
              id: tool.name,
              description: tool.description,
              inputSchema: tool.parameters,
            };
            return acc;
          }, {} as Record<string, any>),
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
              const parentMessageId = currentMessageId || uuidv4();
              subscriber.next({
                type: EventType.TOOL_CALL_START,
                toolCallId: streamPart.toolCallId,
                toolCallName: streamPart.toolName,
                parentMessageId,
              } as ToolCallStartEvent);

              subscriber.next({
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: streamPart.toolCallId,
                delta: JSON.stringify(streamPart.args),
                parentMessageId,
              } as ToolCallArgsEvent);

              subscriber.next({
                type: EventType.TOOL_CALL_END,
                toolCallId: streamPart.toolCallId,
                parentMessageId,
              } as ToolCallEndEvent);
            },
            onToolCallDeltaPart(streamPart) {},
            onToolCallStreamingStartPart(streamPart) {},
            onToolResultPart(streamPart) {},
          });
        })
        .catch((error) => {
          console.log("error", error);
          // Handle error
          subscriber.error(error);
        });

      return () => {};
    });
  }
}

function convertMessagesToMastraMessages(messages: Message[]): CoreMessage[] {
  const result: CoreMessage[] = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      const parts: any[] = message.content
        ? [{ type: "text", text: message.content }]
        : [];
      for (const toolCall of message.toolCalls ?? []) {
        parts.push({
          type: "tool-call",
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          args: JSON.parse(toolCall.function.arguments),
        });
      }
      result.push({
        role: "assistant",
        content: parts,
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
