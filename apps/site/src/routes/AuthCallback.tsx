import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function AuthCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    // Placeholder: in a real site you might exchange code for session or redirect
    // Here we just show the params for visibility during setup
    // eslint-disable-next-line no-console
    console.log("Auth callback params:", Object.fromEntries(params.entries()));
  }, [params]);

  return (
    <div>
      <h1>Auth Callback</h1>
      <p>Processing authentication...</p>
    </div>
  );
}


