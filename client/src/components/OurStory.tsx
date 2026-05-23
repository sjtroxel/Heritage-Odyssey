import React from 'react';

const OurStory: React.FC = () => {
  return (
    <section id="story" className="py-24 px-4 bg-paper border-b border-stone/10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-libre font-bold text-ink mb-6 uppercase tracking-tight">
            The Archivist&apos;s Mission
          </h2>
          <div className="w-24 h-1 bg-brass mx-auto mb-8"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 font-spectral text-lg text-stone leading-relaxed">
            <p>
              Heritage Odyssey began not in a laboratory, but in a dusty attic filled with
              unlabelled daguerreotypes and brittle census records. We realized that while the facts
              of our ancestors were being digitized, their <span className="italic">stories</span>{' '}
              were being lost to time.
            </p>
            <p>
              A spreadsheet can tell you that a man named Giovanni arrived in New York in 1892. It
              cannot tell you the weight of the salt-air on his skin, the smell of the carbolic soap
              in the Great Hall, or the silent vibration of hope that kept him awake in the steerage
              bunks.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 border border-brass/20 rounded-sm transition-transform duration-700 group-hover:rotate-3"></div>
            <div className="bg-stone/5 p-8 border border-stone/20 relative shadow-sm transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:-rotate-2 group-hover:-translate-y-3 group-hover:translate-x-2 group-hover:shadow-lg cursor-default">
              <p className="font-['Great_Vibes'] text-2xl text-ink/75 leading-relaxed">
                &quot;We do not merely index the past; we attempt to hear its heartbeat. Our mission
                is to bridge the gap between dry data and the living legacy of those who crossed
                oceans so that we might stand here today.&quot;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-8 h-px bg-brass"></div>
                <span className="font-['Pinyon_Script'] text-lg text-brass">
                  The Office of Historical Intelligence
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="font-spectral text-xl text-ink italic max-w-2xl mx-auto">
            Every family has an odyssey. We are simply the archivists helping you remember yours.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OurStory;
