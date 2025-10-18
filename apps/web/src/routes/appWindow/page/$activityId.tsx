import { createFileRoute, Link } from "@tanstack/react-router";
import { useConversations } from "@/hooks/useConversations";
import { useAttachments } from "@/hooks/useAttachments";
import { authClient } from "@/lib/auth-client";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Loader2,
  Mail,
  Maximize2,
  Play,
  Search,
  Share2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import AttachmentSheet from "@/components/AttachmentSheet";
import TopicsDisplay from "@/components/TopicsDisplay";
import { MessagesSheet } from "@/components/app-window/MessagesSheet";
import { SummaryChat } from "@/components/app-window/SummaryChat";

export const Route = createFileRoute("/appWindow/page/$activityId")({
  component: ActivityDetailsPageComponent,
});

// Helper function to generate rich content with summary and key points
function generateRichContent(summary: string, keyPoints: string[]): string {
  let content = "";

  // Add summary
  if (summary) {
    content += `<p>${summary.replace(/\n/g, "</p><p>")}</p>`;
  } else {
    content += "<p>No summary available</p>";
  }

  // Add key points if they exist
  if (keyPoints && keyPoints.length > 0) {
    content += `<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600; color: #e4e4e7;">Key Points</h3>`;
    content += `<ul style="margin: 0; padding-left: 20px;">`;
    keyPoints.forEach((point) => {
      content += `<li style="margin-bottom: 8px; color: #d4d4d8;">${point}</li>`;
    });
    content += `</ul>`;
  }

  return content;
}

// Helper function to parse rich content back to summary and key points
function parseRichContent(html: string): {
  summaryText: string;
  keyPointsArray: string[];
} {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Look for Key Points heading
  const keyPointsHeading = Array.from(tempDiv.querySelectorAll("h3")).find(
    (h3) => h3.textContent?.toLowerCase().includes("key points")
  );

  let summaryText = "";
  let keyPointsArray: string[] = [];

  if (keyPointsHeading) {
    // Extract summary (everything before the Key Points heading)
    const summaryContent = [];
    let node = tempDiv.firstChild;
    while (node && node !== keyPointsHeading) {
      if (node.nodeType === Node.TEXT_NODE || node.nodeName === "P") {
        const text = node.textContent?.trim();
        if (text) summaryContent.push(text);
      }
      node = node.nextSibling;
    }
    summaryText = summaryContent.join(" ").trim();

    // Extract key points from the list after the heading
    const listAfterHeading = keyPointsHeading.nextElementSibling;
    if (listAfterHeading && listAfterHeading.tagName === "UL") {
      const listItems = listAfterHeading.querySelectorAll("li");
      keyPointsArray = Array.from(listItems)
        .map((li) => li.textContent?.trim() || "")
        .filter((point) => point.length > 0);
    }
  } else {
    // No key points section, treat entire content as summary
    summaryText = tempDiv.textContent?.trim() || "";
  }

  return { summaryText, keyPointsArray };
}

function ActivityDetailsPageComponent() {
  const { activityId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const [isSummaryChatOpen, setIsSummaryChatOpen] = useState(false);
  const [isMessagesSheetOpen, setIsMessagesSheetOpen] = useState(false);
  const { activities, loading, error } = useConversations(session?.user?.id);
  const { attachments, loading: attachmentsLoading } =
    useAttachments(activityId);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const activity = activities
    .flatMap((group) => group.items)
    .find((item) => item.id === activityId);

  console.log(activity);

  // Initialize state with real activity data
  const [summary, setSummary] = useState<string>("");
  const [topics, setTopics] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);

  // Fetch summary data when activity changes
  useEffect(() => {
    if (activity?.id) {
      const fetchSummary = async () => {
        setSummaryLoading(true);
        try {
          const apiUrl =
            import.meta.env.VITE_SERVER_URL ||
            import.meta.env.VITE_API_URL ||
            "http://localhost:3000";

          const response = await fetch(
            `${apiUrl}/api/summary/${activity.id}/auto`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.summary) {
              setSummaryData(data.summary);
              setSummary(data.summary.summary || "");
              setTopics(data.summary.topics || []);
              setTags(data.summary.tags?.map((tag: any) => tag.name) || []);
              setKeyPoints(data.summary.keyPoints || []);
            }
          }
        } catch (error) {
          console.error("Error fetching summary:", error);
        } finally {
          setSummaryLoading(false);
        }
      };

      fetchSummary();
    }
  }, [activity?.id]);

  const handleSummaryChatSubmit = () => {
    setIsSummaryChatOpen(true);
  };
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <p className="mb-4">Activity not found.</p>
        <Button asChild variant="outline">
          <Link to="/appWindow/page">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activities
          </Link>
        </Button>
      </div>
    );
  }

  // 4. Render the details
  return (
    <div className="h-screen overflow-auto scrollbar-thumb-muted scrollbar-track-background scrollbar-thin">
      <main className="max-w-4xl mx-auto px-8 py-12 pb-32">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-normal mb-4">
            {activity?.title || "Untitled Activity"}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{activity?.time || "No date"}</span>
            </div>
            <div className="flex items-center gap-4">
              <AttachmentSheet
                attachments={attachments}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 hover:bg-zinc-900"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Attachments ({attachments.length})
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 hover:bg-zinc-900"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-zinc-900"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Follow-up email
                </Button>
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                  Try me!
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-zinc-300">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: activity?.summary
                ? activity.summary.startsWith("<")
                  ? activity.summary
                  : `<p>${activity.summary}</p>`
                : "<p>No summary available</p>",
            }}
          />
        </div>

        {/* Summary Section with Key Points */}
        <div className="mt-8">
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              <span className="ml-2 text-zinc-400">
                Loading summary and key points...
              </span>
            </div>
          ) : (
            <div className="text-zinc-300 space-y-6">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: generateRichContent(summary, keyPoints),
                }}
              />

              {/* Topics and Tags Display */}
              <TopicsDisplay topics={topics} tags={summaryData?.tags || []} />
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0  px-8 py-4 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          {!isSummaryChatOpen ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="border  rounded-full group backdrop-blur-md "
              >
                <span className=" flex items-center">
                  <Play
                    className="fill-muted-foreground text-muted-foreground group-hover:text-white group-hover:fill-white transition-colors duration-300 "
                    style={{ width: "9px", height: "9px" }}
                  />
                </span>
                <span className="text-xs text-muted-foreground font-bold group-hover:text-white transition-colors duration-300">
                  Resume
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="border rounded-full group backdrop-blur-md "
                onClick={() => setIsMessagesSheetOpen(true)}
              >
                <span className="">
                  <MessageSquare
                    className="fill-muted-foreground text-muted-foreground group-hover:text-white group-hover:fill-white transition-colors duration-300 "
                    style={{ width: "9px", height: "9px" }}
                  />
                </span>
                <span className="text-xs text-muted-foreground font-bold group-hover:text-white transition-colors duration-300">
                  Messages
                </span>
              </Button>
              <div className="flex-1 relative max-w-sm">
                <Input
                  placeholder="Ask about this summary..."
                  className={`w-full backdrop-blur-md pr-12 border rounded-full h-8 px-4 !bg-transparent text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-300 placeholder:text-muted-foreground hover:!bg-muted`}
                  style={{
                    minHeight: "2rem", // same as buttons, if using h-8
                  }}
                  onFocus={() => setIsSummaryChatOpen(true)}
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-zinc-800 hover:bg-zinc-700"
                  onClick={() => setIsSummaryChatOpen(true)}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <MessagesSheet
        open={isMessagesSheetOpen}
        onOpenChange={setIsMessagesSheetOpen}
        activityId={activityId}
        activityTitle={activity?.title}
        activitySummary={activity?.summary || undefined}
      />

      <SummaryChat
        isOpen={isSummaryChatOpen}
        onClose={() => setIsSummaryChatOpen(false)}
        summary={summary}
        activityTitle={activity?.title}
      />
    </div>
  );
}
