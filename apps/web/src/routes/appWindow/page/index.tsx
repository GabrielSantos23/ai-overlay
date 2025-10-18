import { ActivityDetails } from "@/components/app-window/activities-details";
import CommandPalette from "@/components/app-window/command-palette";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConversations } from "@/hooks/useConversations";
import { useConversationSummary } from "@/hooks/useConversationSummary";
import { authClient } from "@/lib/auth-client";
import type { ActivityItem } from "@/types/types";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, List, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/appWindow/page/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null
  );
  const { data: session } = authClient.useSession();
  const { activities, loading, error } = useConversations(session?.user?.id);

  const { summary, loading: summaryLoading } = useConversationSummary(
    selectedActivity?.id || null
  );

  useEffect(() => {
    if (summary && selectedActivity) {
      setSelectedActivity({
        ...selectedActivity,
        content: summary.summary,
      });
    }
  }, [summary]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    toast.error(error);
  }

  const handleActivityClick = (activityId: string | undefined) => {
    if (!activityId) return;
    navigate({ to: "/appWindow/page/$activityId", params: { activityId } });
  };

  const handleFullscreen = (activity: ActivityItem) => {
    if (!activity.id) return;
    navigate({
      to: "/appWindow/page/$activityId",
      params: { activityId: activity.id },
    });
  };

  return (
    <div className="w-full h-screen overflow-auto text-foreground relative flex scrollbar-thumb-muted scrollbar-track-background scrollbar-thin ">
      <main className="w-full   flex  justify-center  ">
        <div className="max-w-5xl w-full ">
          <div className="my-5 grid gap-4 md:grid-cols-[1fr,auto]">
            <div className="font-bold text-xl">
              Good Morning,{" "}
              <span className="capitalize">{session?.user.name}</span>
            </div>
            <Card className="relative overflow-auto border-0 bg-gradient-to-br from-teal-900/40 to-teal-950/60 p-6">
              <div className="relative z-10">
                <h2 className="mb-2 text-xl font-semibold text-white">
                  Never show up unprepared again
                </h2>
                <p className="mb-4 max-w-xl text-sm text-teal-100/80">
                  Connect your calendar for research on meeting participants,
                  meeting agendas from past calls, and calendar notifications.
                </p>
                <Button className="bg-teal-600 text-white hover:bg-teal-700">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your Activity
              </h2>
              <div className="flex items-center gap-x-3">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-5 w-5 bg-transparent p-2"
                >
                  <RefreshCw />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {activities.map((group) => (
                <div key={group.date}>
                  <div className="mb-3 text-sm text-muted-foreground">
                    {group.date}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id} // Use the unique ID as the key
                        className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50 cursor-pointer"
                        // UPDATED: onClick now navigates to the details page
                        onClick={() => handleActivityClick(item.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-sm">
                            {item.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.duration}
                          </span>
                          <span className=" text-cyan-400 bg-cyan-900/20 px-1 rounded-md text-xs">
                            {item.uses} use{item.uses >= 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      <ActivityDetails
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onFullscreen={handleFullscreen}
      />
    </div>
  );
}
