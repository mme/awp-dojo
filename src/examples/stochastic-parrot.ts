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

interface StochasticParrotEvent {
  type: "response";
  response: string;
}

export class StochasticParrotAgent extends AbstractAgent<StochasticParrotEvent> {
  protected run(input: RunAgentInput): RunAgent<StochasticParrotEvent> {
    return () => {
      const messages = input.messages;
      const lastUserMessage =
        messages.findLast((msg) => msg.role === "user")?.content ||
        "My life is complicated";
      return new Observable<StochasticParrotEvent>((observer) => {
        observer.next({
          type: "response",
          response: StochasticParrotTherapist.completion(lastUserMessage),
        });
        observer.complete();
      });
    };
  }

  protected transform(
    input: RunAgentInput
  ): TransformEvents<StochasticParrotEvent> {
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

class StochasticParrotTherapist {
  public static completion(input: string): string {
    const words = input.trim().toLowerCase().split(/\s+/);

    const reflectedWords = words.map((word) => this.reflections[word] || word);

    const interjection =
      this.parrotInterjections[
        Math.floor(Math.random() * this.parrotInterjections.length)
      ];

    const question =
      this.questionPhrases[
        Math.floor(Math.random() * this.questionPhrases.length)
      ];

    return `${question} "${reflectedWords.join(" ")}"? ${interjection}`;
  }

  private static reflections: Record<string, string> = {
    am: "are",
    are: "am",
    i: "you",
    you: "I",
    me: "you",
    my: "your",
    your: "my",
    "i'm": "you are",
    im: "you are",
    myself: "yourself",
    was: "were",
    were: "was",
    "i'd": "you would",
    "i've": "you have",
    "i'll": "you will",
    "you've": "I have",
    "you'll": "I will",
  };

  private static parrotInterjections: string[] = [
    "Squawk!",
    "Pretty bird!",
    "Polly wants a cracker!",
    "Raawwkk!",
    "Hrrrrk!",
  ];

  private static questionPhrases: string[] = [
    "Why do you say",
    "Could you elaborate on why you said",
    "What makes you mention",
    "Why might you feel",
    "What's behind your statement about",
    "Tell me more about",
  ];
}
