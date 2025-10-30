export function Login() {
  const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;
  const callbackUrl = `${window.location.origin}/auth/callback`;
  const authUrl = serverUrl
    ? `${serverUrl}/api/auth/sign-in/google?redirect_to=${encodeURIComponent(
        `${serverUrl}/auth/callback`
      )}`
    : "";

  return (
    <div>
      <h1>Login</h1>
      <p>Sign in using Google.</p>
      {serverUrl ? (
        <a href={authUrl}>Continue with Google</a>
      ) : (
        <p style={{ color: "#b00" }}>VITE_SERVER_URL is not configured.</p>
      )}
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Callback on this site: <code>{callbackUrl}</code>
      </p>
    </div>
  );
}


