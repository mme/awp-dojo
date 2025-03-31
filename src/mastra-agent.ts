import { HttpAgent } from "@agentwire/client";

export class MastraAgent extends HttpAgent {
  /**
   * Returns the fetch config for the http request.
   * Override this to customize the request.
   *
   * @returns The fetch config for the http request.
   */
  // protected requestInit(input: AgentInput): RequestInit {
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
}
