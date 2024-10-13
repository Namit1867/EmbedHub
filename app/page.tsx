// app/page.tsx

// Declare this as a Client Component
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserAuthForm } from "@/components/user-auth-form"; // Assuming you already have UserAuthForm

export default function AuthenticationPage() {
  const router = useRouter();

  return (
    <div className="container relative h-screen flex flex-col items-center justify-center lg:grid lg:grid-cols-2 lg:px-0">
      {/* Left Side Section with Background Gradient */}
      <div className="relative hidden lg:flex h-full flex-col bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-500 p-10 text-white shadow-lg animate-fadeInLeft">
        <div className="absolute inset-0 bg-zinc-900 opacity-70" />
        <div className="relative z-20 flex items-center text-lg font-semibold space-x-2 animate-slideInDown">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          <span className="tracking-wider">Embed Hub</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-4 text-lg animate-fadeInUp delay-200">
            <p className="italic">
              &ldquo;This platform supports integration with social media platforms, cloud services, and direct uploads for seamless data gathering. Collect data from multiple sources, generate embeddings, and use them as context for querying LLMs to save time and improve efficiency.&rdquo;
            </p>
            <footer className="text-sm text-indigo-200">
              - Simplifying Data Integration
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side Section */}
      <div className="lg:p-12 p-6 flex flex-col items-center justify-center bg-white animate-fadeInRight">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-extrabold tracking-wide text-gray-800 animate-zoomIn">
              Welcome to EmbedHub
            </h1>
            <p className="text-md text-gray-500 animate-fadeInUp delay-200">
              Connect your favorite platforms and get started.
            </p>
          </div>

          {/* Authentication Form */}
          <UserAuthForm />

          {/* Optional Links */}
          <div className="flex justify-center space-x-4 text-sm text-gray-500 pt-4 animate-fadeInUp delay-300">
            <a href="/terms" className="hover:underline">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
