import { useState, useEffect } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

const AnimatedCounter = ({
  target,
  duration = 800,
  suffix = "",
  prefix = "",
  className = "",
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);

  return (
    <span className={`font-mono ${className}`}>
      {prefix}{count}{suffix}
    </span>
  );
};

export default AnimatedCounter;
