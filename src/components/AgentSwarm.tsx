import { useEffect, useRef } from "react";

const AGENTS = [
  { emoji: "🧑‍💼", x: 15, y: 20 },
  { emoji: "👩‍💻", x: 55, y: 10 },
  { emoji: "🎯", x: 80, y: 25 },
  { emoji: "🤔", x: 30, y: 50 },
  { emoji: "💡", x: 65, y: 45 },
  { emoji: "😤", x: 45, y: 75 },
  { emoji: "✅", x: 20, y: 70 },
  { emoji: "💰", x: 75, y: 65 },
  { emoji: "🚀", x: 50, y: 30 },
  { emoji: "📊", x: 85, y: 50 },
  { emoji: "🏢", x: 10, y: 45 },
  { emoji: "🔬", x: 40, y: 15 },
  { emoji: "🎨", x: 70, y: 80 },
  { emoji: "📱", x: 25, y: 85 },
  { emoji: "⚡", x: 60, y: 60 },
];

const AgentSwarm = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nodes = container.querySelectorAll<HTMLElement>(".swarm-node");
    nodes.forEach((node, i) => {
      const delay = i * 0.3;
      const duration = 4 + Math.random() * 3;
      const xDrift = 8 + Math.random() * 12;
      const yDrift = 8 + Math.random() * 12;
      node.style.animation = `swarmFloat${i % 3} ${duration}s ${delay}s ease-in-out infinite`;
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] md:min-h-[400px]"
    >
      {/* Connection lines - SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {AGENTS.slice(0, 10).map((agent, i) => {
          const next = AGENTS[(i + 3) % AGENTS.length];
          return (
            <line
              key={`line-${i}`}
              x1={`${agent.x}%`}
              y1={`${agent.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke="rgba(79, 142, 247, 0.08)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Agent nodes */}
      {AGENTS.map((agent, i) => (
        <div
          key={i}
          className="swarm-node absolute flex items-center justify-center"
          style={{
            left: `${agent.x}%`,
            top: `${agent.y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        >
          <div
            className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full glass-card"
            style={{
              animationDelay: `${i * 0.2}s`,
              opacity: 0.6 + Math.random() * 0.4,
            }}
          >
            <span className="text-lg md:text-xl">{agent.emoji}</span>
            <div
              className="absolute inset-0 rounded-full animate-pulse-glow"
              style={{
                boxShadow: `0 0 ${12 + i * 2}px rgba(79, 142, 247, ${0.05 + (i % 3) * 0.03})`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentSwarm;
