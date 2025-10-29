// Type declarations for Bun (optional)
declare global {
  const Bun:
    | {
        serve: (options: {
          port: number;
          fetch: (request: Request) => Response | Promise<Response>;
          idleTimeout?: number;
        }) => void;
      }
    | undefined;
}

export {};
