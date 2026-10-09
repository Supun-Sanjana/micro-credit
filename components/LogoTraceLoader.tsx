"use client";

import React, { useEffect, useState, useRef } from "react";

type LogoTraceLoaderProps = {
  loading?: boolean;
  isComplete?: boolean;
  size?: number;
  strokeWidth?: number;
  loopDurationSeconds?: number;
  fillFadeSeconds?: number;
  className?: string;
  ariaLabel?: string;
  onDone?: () => void;
};

type LoaderPhase = "loop" | "closingOutline" | "fadingFill" | "done";

const LOGO_VIEW_BOX = "0 0 100 100";

// A minimal, chunky geometric "S" that represents the solid foundation of "Solida"
const TRACE_PATH =
  "M 80 10 L 20 10 L 20 60 L 60 60 L 60 70 L 20 70 L 20 90 L 80 90 L 80 40 L 40 40 L 40 30 L 80 30 Z";

const FILL_PATHS = [TRACE_PATH] as const;

export function LogoTraceLoader({
  loading = true,
  isComplete = false,
  size = 48,
  strokeWidth = 4,
  loopDurationSeconds = 1.5,
  fillFadeSeconds = 0.5,
  className = "",
  ariaLabel = "Loading",
  onDone,
}: LogoTraceLoaderProps) {
  const [phase, setPhase] = useState<LoaderPhase>("loop");
  const onDoneCalled = useRef(false);

  const isDoneOrNotLoading = isComplete || !loading;

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setPhase("done");
      if (isDoneOrNotLoading && !onDoneCalled.current) {
        onDoneCalled.current = true;
        onDone?.();
      }
      return;
    }

    if (isDoneOrNotLoading) {
      if (phase === "loop") {
        setPhase("closingOutline");

        // Wait for outline to close (fast transition)
        const closingTimer = setTimeout(() => {
          setPhase("fadingFill");

          // Wait for fill to fade in
          const fadingTimer = setTimeout(() => {
            setPhase("done");
            if (!onDoneCalled.current) {
              onDoneCalled.current = true;
              onDone?.();
            }
          }, fillFadeSeconds * 1000);

          return () => clearTimeout(fadingTimer);
        }, 300); // 300ms closing duration

        return () => clearTimeout(closingTimer);
      }
    } else {
      setPhase("loop");
      onDoneCalled.current = false;
    }
  }, [isDoneOrNotLoading, phase, fillFadeSeconds, onDone]);

  // CSS for animations
  const styles = `
    @keyframes logo-trace-loader-loop {
      to {
        stroke-dashoffset: -1;
      }
    }
    @keyframes logo-trace-loader-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .logo-trace-closing {
      stroke-dasharray: 1 0;
      stroke-dashoffset: 0;
      transition: stroke-dasharray 0.3s ease-out, stroke-dashoffset 0.3s ease-out;
    }
  `;

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="status"
      aria-label={ariaLabel}
    >
      <style>{styles}</style>
      <svg
        viewBox={LOGO_VIEW_BOX}
        width={size}
        height={size}
        style={{ display: "block" }}
      >
        {/* Background faded track */}
        <g opacity="0.18">
          <path
            d={TRACE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={Math.max(1, strokeWidth / 2)}
            strokeLinejoin="round"
          />
        </g>

        {/* Looping or closing stroke */}
        {phase === "loop" || phase === "closingOutline" ? (
          <path
            d={TRACE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={phase === "loop" ? "0.16 0.84" : "1 0"}
            className={phase === "closingOutline" ? "logo-trace-closing" : ""}
            style={
              phase === "loop"
                ? {
                    animation: `logo-trace-loader-loop ${loopDurationSeconds}s linear infinite`,
                  }
                : {}
            }
          />
        ) : null}

        {/* Fading in filled logo */}
        {(phase === "fadingFill" || phase === "done") &&
          FILL_PATHS.map((path, idx) => (
            <path
              key={idx}
              d={path}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              style={{
                opacity: phase === "done" ? 1 : 0,
                ...(phase === "fadingFill"
                  ? {
                      animation: `logo-trace-loader-fade-in ${fillFadeSeconds}s forwards`,
                    }
                  : {}),
              }}
            />
          ))}
      </svg>
    </div>
  );
}
