import { useState, useEffect } from "react";
import type { ActivityItem } from "@/types/types";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  model: string;
  summary?: string;
}

export function useActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<
    Array<{
      date: string;
      items: ActivityItem[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

        // Use tRPC endpoint with proper format
        const response = await fetch(
          `${apiUrl}/trpc/conversation.getUserConversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              userId: userId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Conversations data:", data);

        // Transform conversations to activities format
        if (data.result?.data) {
          const grouped = groupConversationsByDate(data.result.data);
          setActivities(grouped);
        } else if (Array.isArray(data)) {
          const grouped = groupConversationsByDate(data);
          setActivities(grouped);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch conversations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  return { activities, loading, error };
}

export function groupConversationsByDate(conversations: Conversation[]) {
  const groups = new Map<string, ActivityItem[]>();

  conversations.forEach((conv) => {
    const date = formatDate(conv.createdAt);
    if (!groups.has(date)) {
      groups.set(date, []);
    }

    groups.get(date)?.push({
      id: conv.id,
      title: conv.title || "Untitled session",
      duration: calculateDuration(conv.createdAt, conv.updatedAt),
      uses: 0,
      time: formatTime(conv.createdAt),
      content: null,
      summary: conv.summary || null,
    });
  });

  // Sort by date (most recent first)
  const sorted = Array.from(groups.entries()).sort((a, b) => {
    const dateA = parseDateString(a[0]);
    const dateB = parseDateString(b[0]);
    return dateB.getTime() - dateA.getTime();
  });

  return sorted.map(([date, items]) => ({
    date,
    items: items.sort((a, b) => {
      // Sort items within each day by time (most recent first)
      return b.time.localeCompare(a.time);
    }),
  }));
}

function parseDateString(dateStr: string): Date {
  if (dateStr === "Today") return new Date();
  if (dateStr === "Yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  return new Date(dateStr);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time for comparison
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return "Today";
  } else if (date.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

function formatTime(dateString: string): string {
  return new Date(dateString)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
