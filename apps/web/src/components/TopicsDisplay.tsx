import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Hash } from "lucide-react";

interface TopicsDisplayProps {
  topics: string[];
  tags: Array<{ name: string; category: string }>;
  className?: string;
}

export default function TopicsDisplay({
  topics,
  tags,
  className = "",
}: TopicsDisplayProps) {
  // Group tags by category
  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag.name);
    return acc;
  }, {} as Record<string, string[]>);

  // Category display names and colors
  const categoryConfig = {
    technical: {
      name: "Technical",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    ai: {
      name: "AI & ML",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    work: {
      name: "Work",
      color: "bg-green-500/20 text-green-300 border-green-500/30",
    },
    personal: {
      name: "Personal",
      color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
    general: {
      name: "General",
      color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    },
  };

  if (topics.length === 0 && tags.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Topics Section */}
      {topics.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Section */}
      {tags.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {Object.entries(groupedTags).map(([category, categoryTags]) => {
                const config =
                  categoryConfig[category as keyof typeof categoryConfig] ||
                  categoryConfig.general;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${config.color} text-xs font-medium`}
                      >
                        {config.name}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {categoryTags.length} tag
                        {categoryTags.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryTags.map((tagName, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-zinc-800/30 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/30 transition-colors text-xs"
                        >
                          {tagName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}






