"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const handleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else setTheme("light");
  };

  return (
    <button
      className="flex bottom-0 z-50  "
      type="button"
      onClick={handleTheme}
    >
      <Sun className="border bg-primaryForeground rounded-full border-primary p-1 fixed bottom-10 right-5  h-[2rem] w-[2rem] rotate-0 scale-100 text-primary transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="border bg-primaryForeground rounded-full border-primary p-1  h-[2rem] fixed bottom-10 right-5   w-[2rem] rotate-90 text-primary scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
