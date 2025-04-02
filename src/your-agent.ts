import {
  AbstractAgent,
  RunAgent,
  RunAgentInput,
  TransformEvents,
} from "@agentwire/client";

// TODO
// interface YourEvent {}

// export class YourAgent extends AbstractAgent<YourEvent> {
//   protected run(input: RunAgentInput): RunAgent<YourEvent> {
//     return new Observable<YourEvent>((observer) => {
//       // emit a single event
//       observer.next({
//         type: "your_event",
//         data: "your_data",
//       });
//     });
//   }

//   protected transform(input: RunAgentInput): TransformEvents<YourEvent> {
//     return (source$) => {
//       return source$.pipe(
//         map((event) => {
//           // transform the event to BaseEvent
//           return event;
//         })
//       );
//     };
//   }
// }
