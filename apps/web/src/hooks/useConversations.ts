import { useState, useEffect } from "react";
import type { ActivityItem } from "@/types/types";
import { groupConversationsByDate } from "./useActivities";

export function useConversations(userId: string | undefined) {
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

    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl =
          import.meta.env.VITE_SERVER_URL ||
          import.meta.env.VITE_API_URL ||
          "http://localhost:3000";
        console.log("API URL:", apiUrl);
        console.log("User ID:", userId);

        const response = await fetch(
          `${apiUrl}/api/conversations?userId=${encodeURIComponent(userId)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        // Check if response is OK
        if (!response.ok) {
          const text = await response.text();
          console.error("Error response:", text);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error("Server returned non-JSON response");
        }

        const data = await response.json();
        console.log("Parsed data:", data);

        if (data.success && Array.isArray(data.conversations)) {
          const grouped = groupConversationsByDate(data.conversations as any);
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

    fetchConversations();
  }, [userId]);

  return { activities, loading, error };
}
