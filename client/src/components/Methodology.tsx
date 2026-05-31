import React from 'react';
import { motion } from 'framer-motion';

const Methodology: React.FC = () => {
  // Layered mahogany surface (CSS-only, no image asset): a warm brass light
  // from the top, a diagonal wood-tone body, and a fine vertical grain.
  const mahoganySurface = [
    'radial-gradient(120% 75% at 50% -10%, rgba(154,123,47,0.20), transparent 55%)',
    'repeating-linear-gradient(91deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0) 3px, rgba(255,238,214,0.02) 5px, rgba(0,0,0,0) 8px)',
    'linear-gradient(118deg, #5a2c19 0%, #43200f 45%, #2c1409 100%)',
  ].join(', ');

  return (
    <section
      id="methodology"
      className="py-24 px-4 border-b border-brass/20 relative overflow-hidden"
      style={{ backgroundColor: '#2c1409', backgroundImage: mahoganySurface }}
    >
      {/* Vignette — settles the edges so the cream cards float */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(135% 120% at 50% 45%, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      ></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative mb-16 shadow-2xl"
        >
          <img
            src="/photo-2.jpg"
            alt="Historical research"
            className="w-full max-h-64 object-cover grayscale opacity-80 rounded-sm border border-stone/30"
          />
          <div className="absolute inset-0 bg-cast-iron/10 mix-blend-overlay"></div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/3 lg:sticky lg:top-32"
          >
            <h2 className="text-3xl md:text-4xl font-libre font-bold text-paper mb-6 uppercase tracking-tighter">
              Our Methodology
            </h2>
            <div className="w-12 h-1 bg-brass mb-8"></div>
            <div className="bg-[#fffdfa] p-6 border-l-4 border-brass/50 shadow-xl">
              <p className="font-spectral text-lg text-stone leading-relaxed">
                To transform dry census data into living legacy, we employ a rigorous triple-agent
                orchestration grounded in the{' '}
                <span className="italic font-bold">Push, Liminal, and Pull</span> narrative arc.
              </p>
            </div>
          </motion.div>

          <div className="w-full lg:w-2/3 space-y-12">
            {/* Agent Swarm */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="p-6 md:p-8 border-2 border-brass/20 bg-[#fffdfa] shadow-lg relative overflow-hidden"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-brass/5 -rotate-45 translate-x-8 -translate-y-8"></div>

              <h3 className="text-xs font-libre font-bold tracking-[0.3em] text-brass uppercase mb-10 flex items-center gap-3">
                <span className="w-2 h-2 bg-brass rotate-45"></span>
                The Agent Swarm
              </h3>

              <div className="grid grid-cols-1 gap-10">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
                >
                  <div className="shrink-0 w-12 h-12 border-2 border-stone/10 bg-stone/5 flex items-center justify-center font-libre text-stone/40 font-bold text-lg">
                    01
                  </div>
                  <div>
                    <h4 className="font-libre font-bold text-ink mb-2 uppercase tracking-wide">
                      The Researcher
                    </h4>
                    <p className="font-spectral text-stone leading-relaxed text-base">
                      Scours the Pinecone vector registry for specific historical context—emigration
                      records, regional economic pressures, and period-specific accounts.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
                >
                  <div className="shrink-0 w-12 h-12 border-2 border-stone/10 bg-stone/5 flex items-center justify-center font-libre text-stone/40 font-bold text-lg">
                    02
                  </div>
                  <div>
                    <h4 className="font-libre font-bold text-ink mb-2 uppercase tracking-wide">
                      The Synthesizer
                    </h4>
                    <p className="font-spectral text-stone leading-relaxed text-base">
                      Applies the <span className="italic">Narrative Rubric</span> to map historical
                      data onto a human emotional arc, drafting a story written for the ear.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
                >
                  <div className="shrink-0 w-12 h-12 border-2 border-stone/10 bg-stone/5 flex items-center justify-center font-libre text-stone/40 font-bold text-lg">
                    03
                  </div>
                  <div>
                    <h4 className="font-libre font-bold text-ink mb-2 uppercase tracking-wide">
                      The Narrator
                    </h4>
                    <p className="font-spectral text-stone leading-relaxed text-base">
                      Delivers the final oral history via ElevenLabs voice synthesis, optimized for
                      warmth, cadence, and historical gravity.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Narrative Rubric */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                viewport={{ once: true }}
                className="p-6 border border-stone/20 bg-paper shadow-md group hover:border-brass/40 transition-colors"
              >
                <h4 className="font-libre font-bold text-[10px] tracking-[0.3em] uppercase text-brass mb-4">
                  The Push
                </h4>
                <p className="font-spectral text-base text-stone italic leading-snug">
                  The world left behind—the famine, the war, or the simple hunger for a better
                  horizon.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                viewport={{ once: true }}
                className="p-6 border border-stone/20 bg-paper shadow-md group hover:border-brass/40 transition-colors"
              >
                <h4 className="font-libre font-bold text-[10px] tracking-[0.3em] uppercase text-brass mb-4">
                  The Liminal
                </h4>
                <p className="font-spectral text-base text-stone italic leading-snug">
                  The crossing—steerage bunks, the salt-sting of the Atlantic, and the shedding of
                  an old life.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                viewport={{ once: true }}
                className="p-6 border border-stone/20 bg-paper shadow-md group hover:border-brass/40 transition-colors"
              >
                <h4 className="font-libre font-bold text-[10px] tracking-[0.3em] uppercase text-brass mb-4">
                  The Pull
                </h4>
                <p className="font-spectral text-base text-stone italic leading-snug">
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
