"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/Usermenu";
import TitleBar from "@/components/TitleBar";
import { Toaster } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);
  return (
    <div className="w-full flex h-screen">
      <TitleBar>{children}</TitleBar>
      <Toaster position="top-right" richColors />
    </div>
  );
}
