"use client";

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageCircle,
  Search,
  Eye,
  ChevronDown,
  AudioLines,
  X,
} from "lucide-react";
import { useRef } from "react";

type LiveInsightsPanelProps = {
  show: boolean;
  onClose: () => void;
};

export default function LiveInsightsPanel({
  show,
  onClose,
}: LiveInsightsPanelProps) {
  const insightsRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={insightsRef}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-[#3a3a3a] rounded-2xl p-4 shadow-2xl border border-[#4a4a4a] min-w-[580px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium text-sm">Live Insights</h3>
            <div className="flex items-center gap-2">
              {/* Student Dropdown */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  className="bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white rounded-lg px-3 h-8 gap-2 text-sm"
                >
                  Student
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </motion.div>

              {/* Transcript Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  className="hover:bg-[#4a4a4a] text-[#b0b0b0] hover:text-white rounded-lg px-3 h-8 gap-2 text-sm"
                >
                  <AudioLines className="h-3 w-3" />
                  Transcript
                </Button>
              </motion.div>

              {/* Close Button */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg hover:bg-[#4a4a4a] text-[#b0b0b0] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Action Cards Grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {/* What should I say next? */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#4a4a4a] hover:bg-[#5a5a5a] rounded-xl p-4 text-left transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#5a5a5a] group-hover:bg-[#6a6a6a] rounded-lg p-2 transition-colors">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium text-sm mt-1">
                  What should I say next?
                </span>
              </div>
            </motion.button>

            {/* Follow-up questions */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#4a4a4a] hover:bg-[#5a5a5a] rounded-xl p-4 text-left transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#5a5a5a] group-hover:bg-[#6a6a6a] rounded-lg p-2 transition-colors">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium text-sm mt-1">
                  Follow-up questions
                </span>
              </div>
            </motion.button>

            {/* Fact-check statements */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#4a4a4a] hover:bg-[#5a5a5a] rounded-xl p-4 text-left transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#5a5a5a] group-hover:bg-[#6a6a6a] rounded-lg p-2 transition-colors">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium text-sm mt-1">
                  Fact-check statements
                </span>
              </div>
            </motion.button>

            {/* Recap */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#4a4a4a] hover:bg-[#5a5a5a] rounded-xl p-4 text-left transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#5a5a5a] group-hover:bg-[#6a6a6a] rounded-lg p-2 transition-colors">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium text-sm mt-1">
                  Recap
                </span>
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
