import { HttpAgent } from "@agentwire/client";

export class CustomHttpAgent extends HttpAgent {
  /**
   * Returns the fetch config for the http request.
   * Override this to customize the request.
   *
   * @returns The fetch config for the http request.
   */
  // protected requestInit(input: RunAgentInput): RequestInit {
  //   return {
  //     method: "POST",
  //     headers: {
  //       ...this.headers,
  //       "Content-Type": "application/json",
  //       Accept: "text/event-stream",
  //     },
  //     body: JSON.stringify(input),
  //     signal: this.abortController.signal,
  //   };
  // }
  // run(input: RunAgentInput): RunAgent<HttpEvent> {
  //   return withRunHttpRequest(this.url, this.requestInit(input));
  // }
  // transform(input: RunAgentInput): TransformEvents<HttpEvent> {
  //   return transformHttpEventStream;
  // }
}
