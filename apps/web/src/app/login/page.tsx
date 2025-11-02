"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { errorToast } from "@/lib/exportCustomToast";
import { Loader2, LoaderPinwheel } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  console.log(isAuthenticated);
  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login("google");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/main");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        <span>
          <LoaderPinwheel className="w-32 h-32" />
        </span>
        <h1 className="text-4xl font-semibold">Welcome to Bangg</h1>
        <p className="text-lg text-muted-foreground">
          Your personal Ai assistant
        </p>
        <Button
          className="w-full max-w-md mt-4 bg-secondary text-card-foreground"
          variant="secondary"
          onClick={handleLogin}
          disabled={isLoading || isAuthenticated}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Continue"
          )}
        </Button>
      </div>
      <div className="flex items-end justify-center w-full pb-4">
        <p>
          By signing in, you agree to our{" "}
          <Link href={"/terms" as any}>Terms of Service</Link> and{" "}
          <Link href={"/privacy" as any}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
