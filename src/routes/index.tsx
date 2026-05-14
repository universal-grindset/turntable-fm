import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROOMS } from "../lib/rooms";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/r/$roomId", params: { roomId: ROOMS[0].id } });
  },
});
