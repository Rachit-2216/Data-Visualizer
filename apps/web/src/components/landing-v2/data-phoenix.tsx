'use client';

import { motion, MotionValue } from 'framer-motion';

type DataPhoenixProps = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  rotate: MotionValue<number>;
  trailOpacity: MotionValue<number>;
};

export function DataPhoenix({ x, y, scale, rotate, trailOpacity }: DataPhoenixProps) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[min(42vw,500px)] w-[min(42vw,500px)] -translate-x-1/2 -translate-y-1/2"
      style={{ x, y, scale, rotate }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute left-1/2 top-1/2 h-56 w-[42rem] -translate-x-[80%] -translate-y-1/2 rounded-full bg-gradient-to-l from-cyan-300/0 via-cyan-300/20 to-lime-300/0 blur-3xl"
        style={{ opacity: trailOpacity }}
      />

      <svg viewBox="0 0 520 520" className="relative h-full w-full overflow-visible drop-shadow-[0_0_34px_rgba(34,211,238,0.45)]">
        <defs>
          <radialGradient id="phoenix-core" cx="50%" cy="48%" r="58%">
            <stop offset="0%" stopColor="#ecfeff" stopOpacity="1" />
            <stop offset="38%" stopColor="#22d3ee" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
          </radialGradient>
          <linearGradient id="phoenix-wing" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.06" />
            <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.05" />
          </linearGradient>
          <filter id="phoenix-glow">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={{ rotate: [-2, 3, -2] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '260px 260px' }}
        >
          <path
            d="M248 241 C197 178 125 129 53 118 C104 171 145 227 167 290 C112 280 72 300 36 342 C104 334 169 350 221 390 C220 339 233 288 248 241Z"
            fill="url(#phoenix-wing)"
            stroke="#22d3ee"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
          <path
            d="M272 241 C323 178 395 129 467 118 C416 171 375 227 353 290 C408 280 448 300 484 342 C416 334 351 350 299 390 C300 339 287 288 272 241Z"
            fill="url(#phoenix-wing)"
            stroke="#a3e635"
            strokeOpacity="0.45"
            strokeWidth="2"
          />
        </motion.g>

        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M260 112 C307 160 324 211 305 262 C290 302 273 338 260 397 C247 338 230 302 215 262 C196 211 213 160 260 112Z"
            fill="url(#phoenix-core)"
            filter="url(#phoenix-glow)"
          />
          <path
            d="M260 96 C279 126 278 154 260 184 C242 154 241 126 260 96Z"
            fill="#a3e635"
            opacity="0.9"
          />
          <circle cx="275" cy="190" r="7" fill="#ecfeff" />
          <circle cx="277" cy="188" r="3" fill="#05060a" />
        </motion.g>

        <g stroke="#67e8f9" strokeOpacity="0.52" strokeWidth="1.4">
          {Array.from({ length: 11 }).map((_, index) => (
            <line
              key={`left-feather-${index}`}
              x1={246 - index * 10}
              y1={235 + index * 8}
              x2={92 + index * 13}
              y2={151 + index * 25}
            />
          ))}
          {Array.from({ length: 11 }).map((_, index) => (
            <line
              key={`right-feather-${index}`}
              x1={274 + index * 10}
              y1={235 + index * 8}
              x2={428 - index * 13}
              y2={151 + index * 25}
            />
          ))}
        </g>

        <g>
          {[
            [86, 150],
            [145, 214],
            [205, 350],
            [434, 150],
            [375, 214],
            [315, 350],
            [260, 397],
          ].map(([cx, cy], index) => (
            <motion.circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={index === 6 ? 7 : 5}
              fill={index === 6 ? '#a3e635' : '#22d3ee'}
              animate={{ opacity: [0.45, 1, 0.45], scale: [0.85, 1.2, 0.85] }}
              transition={{ duration: 0.85, delay: index * 0.08, repeat: Infinity }}
            />
          ))}
        </g>

        <motion.g
          animate={{ opacity: [0.25, 0.95, 0.25], y: [0, 16, 0] }}
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
        >
          {[0, 1, 2, 3, 4].map((index) => (
            <rect
              key={index}
              x={220 + index * 18}
              y={408 + index * 8}
              width="9"
              height={28 + index * 8}
              rx="5"
              fill={index % 2 ? '#22d3ee' : '#a3e635'}
              opacity="0.72"
            />
          ))}
        </motion.g>
      </svg>
    </motion.div>
  );
}
