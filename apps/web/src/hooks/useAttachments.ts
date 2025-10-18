import { useState, useEffect } from "react";

interface Attachment {
  id: string;
  messageId: string;
  type: string;
  url: string;
  mediaType: string;
  filename: string;
  size: string;
  createdAt: string;
}

export function useAttachments(conversationId: string | undefined) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setAttachments([]);
      setLoading(false);
      return;
    }

    const fetchAttachments = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl =
          import.meta.env.VITE_SERVER_URL ||
          import.meta.env.VITE_API_URL ||
          "http://localhost:3000";

        const response = await fetch(
          `${apiUrl}/api/attachments/${conversationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Attachments data:", data);

        if (data.success && Array.isArray(data.attachments)) {
          setAttachments(data.attachments);
        }
      } catch (err) {
        console.error("Fetch attachments error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch attachments"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [conversationId]);

  return { attachments, loading, error };
}



