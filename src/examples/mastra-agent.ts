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
    }
  }

  return result;
}
