const env = process.env;

export const getAPIUrl = () => {
  if (env.PROD) return env.NEXTAUTH_URL as string;
  if (env.NEXTAUTH_URL) return `https://${env.NEXTAUTH_URL}`; // SSR should use vercel url
  // Default to port 3001 where the Next.js app runs
  return typeof window !== "undefined" 
    ? window.location.origin 
    : "http://localhost:3001";
};
