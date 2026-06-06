'use client';

import { motion } from 'framer-motion';
import { proofCopy } from './landing-copy';

export function ProductProof() {
  return (
    <section className="bg-[#05060a] px-4 py-20 text-white">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">PRODUCT PROOF</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              {proofCopy.headline}
            </h2>
          </div>
          <p className="max-w-md text-white/54">{proofCopy.microcopy}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {proofCopy.items.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.035 }}
              className="rounded-2xl border border-white/10 bg-[#05060a]/70 p-4 font-mono text-sm uppercase tracking-[0.16em] text-white/68"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
