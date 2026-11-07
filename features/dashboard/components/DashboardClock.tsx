"use client";

import React, { useState, useEffect } from "react";

export interface DashboardClockProps {
  className?: string;
}

export const DashboardClock = React.memo(function DashboardClock({
  className = "text-sm text-white mb-1",
}: DashboardClockProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return <p className={className}>{currentTime}</p>;
});

