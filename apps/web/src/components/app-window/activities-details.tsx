import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ActivityItem } from "@/types/types";
import {
  ArrowRight,
  Calendar,
  Copy,
  MessageSquare,
  Play,
  Send,
  Share2,
  Voicemail,
  Maximize2,
  Loader2,
} from "lucide-react";
import { useConversationSummary } from "@/hooks/useConversationSummary";
import { useEffect, useState } from "react";

interface ActivityDetailsProps {
  activity: ActivityItem | null;
  onClose: () => void;
  onFullscreen?: (activity: ActivityItem) => void;
}

export function ActivityDetails({
  activity,
  onClose,
  onFullscreen,
}: ActivityDetailsProps) {
  const { summary, loading, error } = useConversationSummary(
    activity?.id || null
  );
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    if (activity) {
      // Format the date based on activity data
      // You might need to get this from your activity object
      const date = new Date();
      setFormattedDate(
        date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    }
  }, [activity]);

  const formatSummaryContent = (content: string) => {
    if (!content) return "<p>No content for this session.</p>";

    return content
      .replace(/\*\*(.*?)\*\*/g, "<h3>$1</h3>")
      .replace(/- (.*?)\n/g, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[h|l|p])/gm, "<p>")
      .replace(/(?<![h|l|p]>)$/gm, "</p>");
  };

  return (
    <Sheet open={!!activity} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-3/4 sm:w-3/4 sm:max-w-none bg-background p-0 flex flex-col top-10 h-[calc(100vh-2.5rem)]">
        {activity && (
          <>
            <SheetHeader className="p-6">
              <SheetTitle className="text-2xl font-bold">
                {activity.title}
              </SheetTitle>
              <div className="flex items-center justify-between text-muted-foreground pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                  <span className="mx-2">•</span>
                  <span>{activity.duration}</span>
                </div>
                <div className="flex gap-2">
                  {onFullscreen && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => onFullscreen(activity)}
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Fullscreen
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {summary?.tags && summary.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {summary.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </SheetHeader>

            <div className="px-6 space-y-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                  <p className="text-sm">Failed to load summary: {error}</p>
                </div>
              ) : (
                <>
                  {/* Topics Section */}
                  {summary?.topics && summary.topics.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Topics Discussed</h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.topics.map((topic, index) => (
                          <div
                            key={index}
                            className="px-3 py-1.5 rounded-lg bg-card border text-sm"
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities Section */}
                  {summary?.entities && summary.entities.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Key Entities</h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.entities.map((entity, index) => (
                          <div
                            key={index}
                            className="px-3 py-1.5 rounded-lg bg-card border text-sm"
                          >
                            {entity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Content */}
                  {summary?.summary && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Summary</h3>
                      <div
                        className="prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatSummaryContent(summary.summary),
                        }}
                      />
                    </div>
                  )}

                  {/* Fallback to activity content if no summary */}
                  {!summary && activity.content && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Content</h3>
                      <div
                        className="prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatSummaryContent(activity.content),
                        }}
                      />
                    </div>
                  )}

                  {/* No content message */}
                  {!summary && !activity.content && (
                    <div className="p-4 rounded-lg bg-card border text-center text-muted-foreground">
                      <p className="text-sm">
                        No summary available for this session.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t mt-auto bg-background">
              <div className="flex items-center gap-2 mb-3">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button variant="outline" size="sm">
                  <Voicemail className="h-4 w-4 mr-2" />
                  Transcript
                </Button>
                <Button variant="outline" size="sm" disabled={loading}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Summary
                </Button>
              </div>
              <div className="relative">
                <Input
                  placeholder="Ask about this conversation..."
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
