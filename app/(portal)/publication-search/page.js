"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Header from "./layout/Header";
import PublicationSearchPage from "./components/PublicationSearchPage";

export default function Page() {
  const { isLoading: isAuthLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthLoading) setIsReady(true);
  }, [isAuthLoading]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-40 lg:pt-32 px-4 pb-8 w-full flex justify-center">
        <div className="w-full max-w-[1400px]">
          <Suspense fallback={<div className="text-center py-12 text-gray-500">กำลังโหลด...</div>}>
            <PublicationSearchPage />
          </Suspense>
        </div>
      </main>
    </div>
  );
}