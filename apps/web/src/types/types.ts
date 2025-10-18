export interface ActivityItem {
  id?: string;
  title: string;
  duration: string;
  uses: number;
  time: string;
  content: string | null;
  summary: string | null; // Added summary field for conversation summaries
}
