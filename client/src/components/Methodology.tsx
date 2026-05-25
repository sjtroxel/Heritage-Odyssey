import React from 'react';
import { motion } from 'framer-motion';

const Methodology: React.FC = () => {
  return (
    <section id="methodology" className="py-24 px-4 bg-stone/5 border-b border-stone/10">
      <div className="max-w-5xl mx-auto">
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          src="/photo-2.jpg"
          alt="Historical research"
          className="w-full max-h-64 object-cover grayscale opacity-80 rounded-sm mb-16 shadow-inner"
        />

        <div className="flex flex-col md:flex-row gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:w-1/3 sticky top-32"
          >
            <h2 className="text-4xl font-libre font-bold text-ink mb-6">Our Methodology</h2>
            <div className="w-12 h-1 bg-brass mb-8"></div>
            <p className="font-spectral text-lg text-stone leading-relaxed mb-6">
              To transform dry census data into living legacy, we employ a rigorous triple-agent
              orchestration grounded in the <span className="italic">Push, Liminal, and Pull</span>{' '}
              narrative arc.
            </p>
          </motion.div>

          <div className="md:w-2/3 space-y-12">
            {/* Agent Swarm */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="p-8 border border-brass/20 bg-paper shadow-sm"
            >
              <h3 className="text-xs font-libre font-bold tracking-[0.2em] text-brass uppercase mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brass"></span>
                The Agent Swarm
              </h3>
              <div className="grid grid-cols-1 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 border border-stone/20 flex items-center justify-center font-libre text-stone font-bold text-sm">
                    01
                  </div>
                  <div>
                    <h4 className="font-libre font-bold text-ink mb-2">The Researcher</h4>
                    <p className="font-spectral text-stone leading-relaxed">
                      Scours the Pinecone vector registry for specific historical context—emigration
                      records, regional economic pressures, and period-specific accounts.
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 border border-stone/20 flex items-center justify-center font-libre text-stone font-bold text-sm">
                    02
                  </div>
                  <div>
                    <h4 className="font-libre font-bold text-ink mb-2">The Synthesizer</h4>
                    <p className="font-spectral text-stone leading-relaxed">
                      Applies the <span className="italic">Narrative Rubric</span> to map historical
                      data onto a human emotional arc, drafting a story written for the ear.
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 border border-stone/20 flex items-center justify-center font-libre text-stone font-bold text-sm">
                    03
                  </div>
                  <div>
                    <h4 className="font-libre font-bold text-ink mb-2">The Narrator</h4>
                    <p className="font-spectral text-stone leading-relaxed">
                      Delivers the final oral history via ElevenLabs voice synthesis, optimized for
                      warmth, cadence, and historical gravity.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Narrative Rubric */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                viewport={{ once: true }}
                className="p-6 border-l-2 border-brass bg-paper"
              >
                <h4 className="font-libre font-bold text-xs tracking-widest uppercase text-stone mb-4">
                  The Push
                </h4>
                <p className="font-spectral text-sm text-stone italic">
                  The world left behind—the famine, the war, or the simple hunger for a better
                  horizon.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                viewport={{ once: true }}
                className="p-6 border-l-2 border-brass bg-paper"
              >
                <h4 className="font-libre font-bold text-xs tracking-widest uppercase text-stone mb-4">
                  The Liminal
                </h4>
                <p className="font-spectral text-sm text-stone italic">
                  The crossing—steerage bunks, the salt-sting of the Atlantic, and the shedding of
                  an old life.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                viewport={{ once: true }}
                className="p-6 border-l-2 border-brass bg-paper"
              >
                <h4 className="font-libre font-bold text-xs tracking-widest uppercase text-stone mb-4">
                  The Pull
                </h4>
                <p className="font-spectral text-sm text-stone italic">
                  The arrival—the roar of New York, the chalk mark on a coat, and the first word of
                  a new story.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Methodology;
