import { createBrowserRouter } from "react-router";
import { SimpleVoiceAgent } from "./SimpleComponents/SimpleVoiceAgent";

export const router = createBrowserRouter([
  { path: "/", Component: SimpleVoiceAgent },
  { path: "*", Component: SimpleVoiceAgent },
]);
