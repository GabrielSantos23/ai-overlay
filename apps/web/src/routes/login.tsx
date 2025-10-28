import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import TitleBar from "@/components/TitleBar";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="h-screen">
      <TitleBar>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </TitleBar>
    </div>
  );
}
