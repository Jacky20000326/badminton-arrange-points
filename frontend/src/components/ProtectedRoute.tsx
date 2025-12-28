"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "PLAYER" | "ORGANIZER" | "ADMIN";
}

/**
 * ProtectedRoute Component
 * Wraps pages that require authentication
 * Handles loading state and redirects unauthorized users to login
 */
export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    // Only redirect after auth context is fully initialized
    if (!initialized) {
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      // Store the intended destination to redirect after login
      sessionStorage.setItem("redirectAfterLogin", pathname);
      router.replace("/login");
      return;
    }

    // Check role-based access
    if (requiredRole && user.role !== requiredRole) {
      // User is authenticated but doesn't have required role
      router.replace("/dashboard");
    }
  }, [user, loading, initialized, pathname, router, requiredRole]);

  // Show loading state while initializing auth or checking permissions
  if (!initialized || (initialized && loading)) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // User not authenticated, let the effect handle redirect
  if (!user) {
    return null;
  }

  // User is authenticated and has required role
  return <>{children}</>;
}
