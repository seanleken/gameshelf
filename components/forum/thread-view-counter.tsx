"use client";

import { useEffect } from "react";
import { incrementThreadViews } from "@/actions/forum";

interface ThreadViewCounterProps {
  threadId: string;
}

export function ThreadViewCounter({ threadId }: ThreadViewCounterProps) {
  useEffect(() => {
    incrementThreadViews(threadId);
  }, [threadId]);

  return null;
}
