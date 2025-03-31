import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  EventType,
  AgentInputSchema,
  TextMessageStart,
  TextMessageContent,
  TextMessageEnd,
  RunStarted,
  RunFinished,
} from "@agentwire/core";
import { EventEncoder } from "@agentwire/encoder";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  // Create event encoder with accept header from request
  const eventEncoder = new EventEncoder({
    accept: req.headers.get("accept") || undefined,
  });

  try {
    // Parse and validate the request body
    const body = await req.json();
    const input = AgentInputSchema.parse(body);

    const messageId = uuidv4();
    const timestamp = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: any) => {
          controller.enqueue(encoder.encode(eventEncoder.encode(event)));
        };

        // First event must be run_started
        sendEvent({
          type: EventType.RUN_STARTED,
          timestamp,
          thread_id: input.thread_id,
          run_id: input.run_id,
        } as RunStarted);

        // Start of message
        sendEvent({
          type: EventType.TEXT_MESSAGE_START,
          timestamp,
          message_id: messageId,
          role: "assistant",
          thread_id: input.thread_id,
          run_id: input.run_id,
        } as TextMessageStart);

        // Initial content chunk
        sendEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          timestamp: Date.now(),
          message_id: messageId,
          delta: "Mastra integration in: ",
          thread_id: input.thread_id,
          run_id: input.run_id,
        } as TextMessageContent);

        for (let count = 10; count >= 1; count--) {
          sendEvent({
            type: EventType.TEXT_MESSAGE_CONTENT,
            timestamp: Date.now(),
            message_id: messageId,
            delta: `${count}  `,
            thread_id: input.thread_id,
            run_id: input.run_id,
          } as TextMessageContent);

          await sleep(300);
        }

        // Final checkmark
        sendEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          timestamp: Date.now(),
          message_id: messageId,
          delta: "✓",
          thread_id: input.thread_id,
          run_id: input.run_id,
        } as TextMessageContent);

        // End of message
        sendEvent({
          type: EventType.TEXT_MESSAGE_END,
          timestamp: Date.now(),
          message_id: messageId,
          thread_id: input.thread_id,
          run_id: input.run_id,
        } as TextMessageEnd);

        // Last event must be run_finished
        sendEvent({
          type: EventType.RUN_FINISHED,
          timestamp: Date.now(),
          thread_id: input.thread_id,
          run_id: input.run_id,
        } as RunFinished);

        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}
