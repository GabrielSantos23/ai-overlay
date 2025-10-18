import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Image as ImageIcon, Download, Maximize2, X } from "lucide-react";
import { useState } from "react";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  size?: string;
  createdAt: string;
}

interface AttachmentSheetProps {
  attachments: Attachment[];
  trigger: React.ReactNode;
}

export default function AttachmentSheet({
  attachments,
  trigger,
}: AttachmentSheetProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openFullSize = (url: string) => {
    setSelectedImage(url);
  };

  const closeFullSize = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent className="w-full sm:max-w-2xl bg-zinc-900 border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-zinc-200">Attachments</SheetTitle>
            <SheetDescription className="text-zinc-400">
              {attachments.length} attachment
              {attachments.length !== 1 ? "s" : ""} found
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {attachments.map((attachment) => (
              <Card
                key={attachment.id}
                className="bg-zinc-800/50 border-zinc-700"
              >
                <CardContent className="p-0">
                  <div className="relative group">
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="w-full h-64 object-cover rounded-t-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-64 bg-zinc-800 rounded-t-lg flex items-center justify-center">
                              <div class="text-center">
                                <svg class="h-12 w-12 text-zinc-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-zinc-400">Image not available</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-white/20"
                        onClick={() => openFullSize(attachment.url)}
                      >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-white/20"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-zinc-200 font-medium truncate flex-1">
                        {attachment.filename}
                      </p>
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-zinc-700 text-zinc-300"
                      >
                        Image
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-zinc-500">
                      <p>
                        {new Date(attachment.createdAt).toLocaleDateString()} at{" "}
                        {new Date(attachment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {attachment.size && (
                        <p>
                          {(parseInt(attachment.size) / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Full Size Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeFullSize}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}



