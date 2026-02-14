"use client";

import { useState, useEffect, useRef } from "react";

interface LoadingTimerProps {
  estimatedSeconds: number;
  label?: string;
  compact?: boolean;
}

export default function LoadingTimer({ estimatedSeconds, label, compact = false }: LoadingTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, estimatedSeconds - elapsed);

  if (compact) {
    return (
      <span className="text-text-muted text-[10px]">
        {elapsed}s / ~{estimatedSeconds}s
      </span>
    );
  }

  return (
    <div className="text-xs text-text-muted">
      {label && <span>{label} </span>}
      <span>{elapsed}s elapsed</span>
      {remaining > 0 ? (
        <span> · ~{remaining}s remaining</span>
      ) : (
        <span> · almost done...</span>
      )}
    </div>
  );
}
