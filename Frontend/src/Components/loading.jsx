import { useEffect, useMemo, useState } from "react";

// Pulse keyframe animation injected once into the document head at mount
const KEYFRAMES = `
@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
`;

/**
 * CircularBubbleLoading
 *
 * Full-screen overlay spinner with 8 orbiting bubbles and an animated
 * loading text label. Injects its keyframe CSS into the document head
 * on mount and removes it on unmount.
 *
 * @param {string} text - Label shown below the spinner (default: "Loading")
 */
const CircularBubbleLoading = ({ text = "Loading" }) => {
  // Cycles through "", ".", "..", "..." to animate the trailing dots
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Injects the pulse keyframe style tag once; cleans up on unmount
  useEffect(() => {
    if (typeof document === "undefined") return;

    let styleTag = document.querySelector("style[data-loading-keyframes]");
    let created = false;

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.setAttribute("data-loading-keyframes", "true");
      styleTag.textContent = KEYFRAMES;
      document.head.appendChild(styleTag);
      created = true;
    }

    return () => {
      if (created && styleTag?.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, []);

  // Memoised array of 8 empty slots used to render the bubble ring
  const bubbles = useMemo(() => [...Array(8)], []);

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Bubble ring: each bubble is positioned around a circle using trigonometry */}
        <div style={styles.circle}>
          {bubbles.map((_, i) => {
            const angle = (i * 360) / bubbles.length;
            return (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  top: `${50 + 25 * Math.sin((angle * Math.PI) / 180)}%`,
                  left: `${50 + 25 * Math.cos((angle * Math.PI) / 180)}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            );
          })}
        </div>

        {/* Loading label with animated trailing dots */}
        <div style={styles.text}>
          {text}
          {dots}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  circle: {
    position: "relative",
    width: "60px",
    height: "60px",
    marginBottom: "10px",
  },
  bubble: {
    position: "absolute",
    width: "10px",
    height: "10px",
    backgroundColor: "#1976d2",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0.3,
    animation: "pulse 1s infinite ease-in-out",
  },
  text: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1976d2",
  },
};

export default CircularBubbleLoading;
