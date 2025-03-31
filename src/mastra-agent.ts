import { HttpAgent } from "@agentwire/client";

export class MastraAgent extends HttpAgent {
  // /** Modify this to customize the request */
  // protected requestInit(): RequestInit {
  //   return {
  //     method: "POST",
  //     headers: {
  //       ...this.headers,
  //       "Content-Type": "application/json",
  //       Accept: "text/event-stream",
  //     },
  //     body: JSON.stringify(this.input()),
  //     signal: this.abortController.signal,
  //   };
  // }
}
