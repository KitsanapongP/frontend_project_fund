"use client";

import AuthGuard from "../../components/AuthGuard";

export default function MouLayout({ children }) {
  return <AuthGuard allowedRoles={["admin"]}>{children}</AuthGuard>;
}
