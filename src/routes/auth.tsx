import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect } from "react";

function AuthRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/login" });
  }, [navigate]);

  return null;
}

export const Route = createFileRoute("/auth")({
  component: AuthRedirect,
});
