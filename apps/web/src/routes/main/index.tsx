import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Ellipsis, RefreshCw, Loader2 } from "lucide-react";
import { trpc, queryClient, trpcClient } from "@/utils/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Toast } from "radix-ui";
import { toast } from "sonner";
import { successToast } from "@/lib/exportCustomToast";

export const Route = createFileRoute("/main/")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/login" });
    }
    return { session: session.data };
  },
  component: RouteComponent,
});

const getGreeting = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "Good Morning";
  if (currentHour >= 12 && currentHour < 18) return "Good Afternoon";
  return "Good Evening";
};

// Helper to format date like "Sat, Oct 15"
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// Helper to format time like "10:34 AM"
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const {
    data: conversations,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.conversations.getConversations.queryOptions());

  const greeting = getGreeting();

  return (
    <div className="w-full h-[calc(100vh-96px)] text-foreground relative flex overflow-hidden">
      <main className="w-full flex justify-center overflow-y-auto">
        <div className="max-w-5xl w-full p-6">
          <div className="my-5 grid gap-4">
            <h2 className="font-bold text-xl">
              {greeting},
              <span className="capitalize"> {session?.user?.name}</span>
            </h2>
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
                  onClick={() => refetch()}
                  className="h-6 w-6 bg-transparent p-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {conversations?.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ConversationRow({ conversation }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-x-4 w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col w-full">
        <span className="text-sm text-accent font-bold">
          {formatDate(conversation.updatedAt || conversation.createdAt)}
        </span>

        <div className="relative">
          <Button
            variant="secondary"
            className="flex bg-transparent justify-between items-center w-full hover:bg-accent/30 cursor-pointer rounded-xl px-2 my-1 transition"
            type="button"
          >
            <p className="px-5 font-semibold">{conversation?.title}</p>

            {/* Time (always mounted, fades out) */}
            <motion.span
              animate={{ opacity: hovered ? 0 : 1, y: hovered ? -5 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground pr-3 absolute right-3"
            >
              {formatTime(conversation.createdAt)}
            </motion.span>

            {/* Dropdown (always mounted, fades in) */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 5 }}
              transition={{ duration: 0.2 }}
              className="absolute right-2"
            >
              <DropdownConversations conversationId={conversation.id} />
            </motion.div>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const DropdownConversations = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyLink = useQuery({
    ...trpc.conversations.copyConversationLink.queryOptions({ conversationId }),
    enabled: false, // Only run when manually triggered
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await trpcClient.conversations.deleteConversation.mutate({
        conversationId,
      });
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["conversations", "getConversations"],
        });
        setShowDeleteDialog(false);
        successToast("Conversation deleted");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const result = await copyLink.refetch();
      if (result.data?.success) {
        await navigator.clipboard.writeText(result.data.link);
        console.log("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to copy link");
    }
  };

  const handleRegenerate = async () => {
    try {
      const result = await trpcClient.conversations.regenerateMessage.mutate({
        conversationId,
        messageId: "placeholder",
      });
      if (result.success) {
        console.log(result.message); // Shows placeholder message
      }
    } catch (error) {
      console.error("Failed to regenerate:", error);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent/40 p-2 rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Ellipsis className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-40 bg-card/70 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink();
            }}
            disabled={copyLink.isFetching}
          >
            <p className="px-5">
              {copyLink.isFetching ? "Copying..." : "Copy Link"}
            </p>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleRegenerate();
            }}
          >
            <p className="px-5">Regenerate</p>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="hover:bg-destructive/20 focus:bg-destructive/20"
          >
            <p className="px-5 text-destructive">Delete</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
