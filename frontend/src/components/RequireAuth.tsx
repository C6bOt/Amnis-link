import React from 'react';
import { Navigate } from 'react-router-dom';

import { useUserContext } from "../context/user-context";

export default function RequireAuth({ children }: { children: any }) {
  const { user, loading } = useUserContext();

  if (loading) {
    return "Loading...";
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
