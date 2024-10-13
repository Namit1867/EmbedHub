"use client"; // Mark this component as client

import * as React from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for useRouter in App Router
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signOut, useSession } from "next-auth/react";  // Import useSession
import { useForm } from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { userAuthSchema } from "@/lib/validations/auth";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGitHubLoading, setIsGitHubLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const router = useRouter();

  // Get session details using useSession
  const { data: session, status } = useSession();

  // Check if session is expired based on expires field
  const isSessionExpired = (expires: string) => {
    const currentTimeUTC = new Date().toISOString(); // Current time in UTC
    const expiresTimeUTC = new Date(expires).toISOString(); // Session expiration time in UTC
    return currentTimeUTC > expiresTimeUTC;
  };

  // Handle session and redirection based on provider and expiration
  React.useEffect(() => {
    if (status === "authenticated") {

      // Check if session has expired
      if (isSessionExpired(session?.expires)) {
        signOut({ redirect: false });
        localStorage.removeItem("session");
        router.push("/");
      } else {
        // Check the provider and redirect to the appropriate dashboard
        if (session?.provider === "github") {
          router.push("/github-dashboard");
        }

        if (session?.provider === "google") {
          router.push("/google-drive-dashboard");
        }
      }
    }

    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSignIn = async (provider: "github" | "google") => {
    try {
      if (provider === "github") {
        setIsGitHubLoading(true);
      }
      if (provider === "google") {
        setIsGoogleLoading(true);
      };

      // Use signIn with redirect: false to handle manual redirection
      const result = await signIn(provider, { redirect: false });

    } catch (error) {
      console.error("Sign-in error:", error);
    } finally {
      setIsGitHubLoading(false);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }))}
        onClick={() => handleSignIn("github")}
        disabled={isLoading || isGitHubLoading || isGoogleLoading}
      >
        {isGitHubLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}
        GitHub
      </button>

      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }))}
        onClick={() => handleSignIn("google")}
        disabled={isLoading || isGitHubLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}{" "}
        Google
      </button>
    </div>
  );
}
