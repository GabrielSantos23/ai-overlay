import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Menu from "@/components/floating-menu/menu";
import Header from "@/components/header";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <Menu />
    </div>
  );
}
