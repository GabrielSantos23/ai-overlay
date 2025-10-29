import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/main/")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/login" });
    }
    return { session: session.data };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/main/"!</div>;
}
