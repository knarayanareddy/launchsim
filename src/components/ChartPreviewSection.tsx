import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { iteration: "v1", score: 4.2, marketFit: 3.1, viability: 5.0 },
  { iteration: "v2", score: 5.8, marketFit: 5.4, viability: 6.1 },
  { iteration: "v3", score: 6.1, marketFit: 6.0, viability: 5.9 },
  { iteration: "v4", score: 7.4, marketFit: 7.8, viability: 7.0 },
  { iteration: "v5", score: 7.9, marketFit: 8.2, viability: 7.5 },
  { iteration: "v6", score: 8.6, marketFit: 8.9, viability: 8.3 },
];

const ChartPreviewSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Watch Your Score <span className="text-primary">Climb</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Each iteration sharpens your pitch. Data proves it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-6 mb-6 font-mono text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
              Overall Score
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-secondary" />
              Market Fit
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-warning" />
              Viability
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorViability" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="iteration"
                tick={{ fill: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 40%, 10%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                  color: "#E2E8F0",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#4F8EF7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
              <Area
                type="monotone"
                dataKey="marketFit"
                stroke="#00D4AA"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFit)"
              />
              <Area
                type="monotone"
                dataKey="viability"
                stroke="#F5A623"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorViability)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
};

export default ChartPreviewSection;
