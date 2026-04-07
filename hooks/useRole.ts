"use client";

import { useAuth } from "@clerk/nextjs";

export function useRole() {
  const { sessionClaims } = useAuth();

  return sessionClaims?.metadata?.role?.toLowerCase() || "professional";
}