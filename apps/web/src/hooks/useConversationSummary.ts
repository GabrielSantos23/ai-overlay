import { useState, useEffect } from "react";

interface Summary {
  id: string;
  conversationId: string;
  summary: string;
  tags: string[];
  entities: string[];
  topics: string[];
  createdAt: string;
  updatedAt: string;
}

export function useConversationSummary(conversationId: string | null) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl =
          import.meta.env.VITE_SERVER_URL ||
          import.meta.env.VITE_API_URL ||
          "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/summary/${conversationId}/auto`
        );
        const data = await response.json();

        if (data.success) {
          setSummary(data.summary);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch summary"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [conversationId]);

  return { summary, loading, error };
}
