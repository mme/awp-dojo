import {
  AbstractAgent,
  RunAgent,
  RunAgentInput,
  TransformEvents,
  EventType,
  RunStarted,
  TextMessageStart,
  TextMessageContent,
  TextMessageEnd,
  RunFinished,
} from "@agentwire/client";
import { Observable, from, of } from "rxjs";
import { mergeMap } from "rxjs/operators";

interface YourCustomAgentEvent {
  type: "response";
  response: string;
}

export class YourCustomAgent extends AbstractAgent<YourCustomAgentEvent> {
  protected run(input: RunAgentInput): RunAgent<YourCustomAgentEvent> {
    return () => {
      return new Observable<YourCustomAgentEvent>((observer) => {
        observer.next({
          type: "response",
          response: "Hello, world!",
        });
        observer.complete();
      });
    };
  }

  protected transform(
    input: RunAgentInput
  ): TransformEvents<YourCustomAgentEvent> {
    return (source$) =>
      source$.pipe(
        mergeMap((event) => {
          // Ensure event type is "response" or throw exception
          if (event.type === "response") {
            // Start the run with RUN_STARTED
            const runStartedEvent: RunStarted = {
              type: EventType.RUN_STARTED,
              threadId: input.threadId,
              runId: input.runId,
            };

            // Start the message with TEXT_MESSAGE_START
            const textMessageStartEvent = {
              type: EventType.TEXT_MESSAGE_START,
              messageId: Date.now().toString(),
            } as TextMessageStart;

            // Then emit TEXT_MESSAGE_CONTENT
            const textMessageContentEvent = {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId: textMessageStartEvent.messageId,
              delta: event.response,
            } as TextMessageContent;

            // Finally emit TEXT_MESSAGE_END
            const textMessageEndEvent = {
              type: EventType.TEXT_MESSAGE_END,
              messageId: textMessageStartEvent.messageId,
            } as TextMessageEnd;

            const runFinishedEvent: RunFinished = {
              type: EventType.RUN_FINISHED,
              threadId: input.threadId,
              runId: input.runId,
            };

            return from([
              runStartedEvent,
              textMessageStartEvent,
              textMessageContentEvent,
              textMessageEndEvent,
              runFinishedEvent,
            ]);
          }

          throw new Error(`Unexpected event type: ${event.type}`);
        })
      );
  }
}
