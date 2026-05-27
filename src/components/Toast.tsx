"use client";
import { useEffect, useState } from "react";
import type { Notification } from "./NotificationContext";

type Props = {
  notification: Notification;
  onClose: () => void;
};

export function Toast({ notification, onClose }: Props) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger exit animation at end of duration
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, (notification.duration ?? 6000) - 300);

    return () => clearTimeout(exitTimer);
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  // Map notification type to colors and icons
  const getStyle = () => {
    switch (notification.type) {
      case "goal":
        return {
          bg: "bg-gradient-to-r from-[var(--crimson)] to-[#ff6b9d]",
          border: "border-[var(--crimson)]",
          icon: "⚽",
          emoji: "🎉",
        };
      case "leaderboard":
        return {
          bg: "bg-gradient-to-r from-[var(--gold)] to-[#ffd700]",
          border: "border-[var(--gold)]",
          icon: "🥇",
          emoji: "📈",
        };
      case "success":
        return {
          bg: "bg-gradient-to-r from-[var(--pitch-light)] to-[#2ecc71]",
          border: "border-[var(--pitch-light)]",
          icon: "✓",
          emoji: "✨",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-[#ff9800] to-[#ffb74d]",
          border: "border-[#ff9800]",
          icon: "⚠",
          emoji: "⚡",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-[var(--card-2)] to-[var(--bg-2)]",
          border: "border-[var(--border)]",
          icon: "ℹ",
          emoji: "💬",
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`
        pointer-events-auto transform transition-all duration-300
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
      role="alert"
    >
      <div
        className={`
          relative overflow-hidden rounded-lg border ${style.border}
          ${style.bg} text-white shadow-xl
          p-4 max-w-sm
        `}
      >
        {/* Shiny background animation */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-pulse"
          style={{
            animation: "shine 2s infinite",
          }}
        />

        {/* Content */}
        <div className="relative flex items-start gap-3">
          {/* Icon with bounce animation */}
          <div className="text-2xl flex-shrink-0 animate-bounce">{style.icon}</div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm flex items-center gap-1">
              {notification.title}
              <span className="text-lg animate-pulse">{style.emoji}</span>
            </div>
            <p className="text-xs text-white/90 mt-1 leading-relaxed">{notification.message}</p>

            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0 text-lg"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/30"
          style={{
            animation: `progress ${notification.duration}ms linear forwards`,
          }}
        />

        <style jsx>{`
          @keyframes shine {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }

          @keyframes progress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
