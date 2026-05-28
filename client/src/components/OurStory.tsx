import React from 'react';
import { motion } from 'framer-motion';

const OurStory: React.FC = () => {
  const parchmentTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  return (
    <section
      id="story"
      className="py-24 px-4 border-b border-stone/10 relative overflow-hidden"
      style={{
        backgroundColor: '#f9f5f0',
        backgroundImage: parchmentTexture,
        backgroundBlendMode: 'multiply',
      }}
    >
      {/* Hand-drawn line accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brass/20 to-transparent"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative mb-16"
        >
          <img
            src="/photo-1.jpg"
            alt="Historical archive"
            className="w-full max-h-64 object-cover grayscale opacity-80 rounded-sm shadow-2xl border border-stone/20"
          />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brass/10 border border-brass/20 rounded-full blur-2xl -z-10"></div>
        </motion.div>

        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-libre font-bold text-ink mb-6 uppercase tracking-tight"
          >
            The Archivist&apos;s Mission
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-24 h-1 bg-brass mx-auto mb-8 origin-center"
          ></motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-2 md:order-1"
          >
            <div className="bg-[#fffdfa] border border-stone/20 p-8 md:p-10 shadow-lg relative">
              {/* Corner seal-like accent */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass/20 m-2"></div>

              <div className="space-y-6 font-spectral text-lg text-stone leading-relaxed">
                <p>
                  Heritage Odyssey began not in a laboratory, but in a dusty attic filled with
                  unlabelled daguerreotypes and brittle census records. We realized that while the
                  facts of our ancestors were being digitized, their{' '}
                  <span className="italic font-bold text-ink/80">stories</span> were being lost to
                  time.
                </p>

                {/* Mobile-only image: centered and non-floating */}
                <div className="md:hidden relative group my-8 max-w-xs mx-auto">
                  <div className="absolute -inset-2 bg-cast-iron/5 rotate-1 rounded-sm -z-10"></div>
                  <img
                    src="/photo-3.jpg"
                    alt="Historical document"
                    className="w-full grayscale border border-stone/30 shadow-md"
                  />
                  <p className="mt-3 text-[10px] text-stone/60 italic leading-tight text-right uppercase tracking-widest font-libre">
                    Registry Entry No. 42-A, <br />
                    Port of Departure, 1888.
                  </p>
                </div>

                <div className="hidden md:block relative group my-8 md:float-right md:ml-6 md:mb-4 md:mt-2 max-w-full md:max-w-50">
                  <div className="absolute -inset-2 bg-cast-iron/5 rotate-1 rounded-sm -z-10"></div>
                  <img
                    src="/photo-3.jpg"
                    alt="Historical document"
                    className="w-full grayscale border border-stone/30 shadow-md transition-shadow group-hover:shadow-lg"
                  />
                  <p className="mt-3 text-[10px] text-stone/60 italic leading-tight text-right uppercase tracking-widest font-libre">
                    Registry Entry No. 42-A, <br />
                    Port of Departure, 1888.
                  </p>
                </div>

                <p>
                  A spreadsheet can tell you that a man named Giovanni arrived in New York in 1892.
                  It cannot tell you the weight of the salt-air on his skin, the smell of the
                  carbolic soap in the Great Hall, or the silent vibration of hope that kept him
                  awake in the steerage bunks.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative group order-1 md:order-2 mb-8 md:mb-0"
          >
            <div className="absolute -inset-4 border border-brass/30 rounded-sm transition-transform duration-1000 group-hover:rotate-2 border-dashed opacity-50"></div>
            <div className="bg-[#fffcf8] p-8 md:p-10 border-2 border-stone/20 relative shadow-xl transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:-translate-y-2 group-hover:shadow-2xl cursor-default overflow-hidden">
              {/* Subtle background insignia */}
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <div className="w-32 h-32 border-8 border-ink rounded-full flex items-center justify-center font-libre font-bold text-4xl">
                  HO
                </div>
              </div>

              <p className="font-['Great_Vibes'] text-2xl md:text-3xl text-ink/80 leading-relaxed relative z-10">
                &quot;We do not merely index the past; we attempt to hear its heartbeat. Our mission
                is to bridge the gap between dry data and the living legacy of those who crossed
                oceans so that we might stand here today.&quot;
              </p>
              <div className="mt-8 flex items-center gap-4 relative z-10">
                <div className="w-10 h-px bg-brass"></div>
                <span className="font-['Pinyon_Script'] text-base sm:text-xl text-brass">
                  The Office of Historical Intelligence
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="max-w-2xl mx-auto bg-cast-iron p-10 border border-brass/30 shadow-2xl relative overflow-hidden group">
            {/* Subtle light sweep effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-paper/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            <p className="font-spectral text-xl md:text-2xl text-paper italic leading-relaxed relative z-10">
              Every family has an odyssey. We are simply the archivists helping you remember yours.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OurStory;
