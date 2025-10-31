import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { open } from "@tauri-apps/plugin-shell";
export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/main",
            });
            toast.success("Sign in successful");
          },
          onError: (error: any) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Submitting..." : "Sign In"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="outline"
          className="w-full mb-2"
          onClick={async () => {
            try {
              const serverUrl =
                import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
              const callbackURL = `${serverUrl}/auth/callback`;

              try {
                const response = await fetch(
                  `${serverUrl}/api/auth/sign-in/social`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      provider: "google",
                      callbackURL,
                    }),
                    redirect: "manual", // Don't follow redirect, get the response
                  }
                );

                // If we get a redirect, extract the location header
                if (response.status >= 300 && response.status < 400) {
                  const location = response.headers.get("location");
                  if (location) {
                    console.log("🚀 Opening Google OAuth:", location);
                    await open(location);
                    toast.info("Aguardando autenticação no navegador...");
                    return;
                  }
                }

                // If successful, user is already authenticated
                if (response.ok) {
                  const data = await response.json();
                  if (data.user) {
                    toast.success("Sign in successful");
                    navigate({ to: "/main" });
                    return;
                  }
                }

                // If we get here, something went wrong
                const errorData = await response
                  .json()
                  .catch(() => ({ error: { message: "Unknown error" } }));
                toast.error(
                  errorData.error?.message || "Failed to initiate Google login"
                );
              } catch (fetchError: any) {
                // If fetch fails, try constructing the URL directly
                // Better Auth will redirect to Google OAuth
                const oauthUrl = `${serverUrl}/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(
                  callbackURL
                )}`;
                console.log("🚀 Opening Google OAuth (fallback):", oauthUrl);
                await open(oauthUrl);
                toast.info("Aguardando autenticação no navegador...");
              }
            } catch (e: any) {
              console.error(e);
              toast.error(
                e?.error?.message ||
                  e?.message ||
                  "Failed to initiate Google login"
              );
            }
          }}
        >
          Continue with Google
        </Button>
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Need an account? Sign Up
        </Button>
      </div>
    </div>
  );
}
