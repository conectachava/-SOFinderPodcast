"use client";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Client-side route guards are not an authorization boundary (see AGENTS.md).
  // Rendering children directly prevents forced redirects to unreachable external Hub hosts (gs.conectachava.com)
  // and allows public access to the Landing Page and interactive Studio workspace.
  return <>{children}</>;
}