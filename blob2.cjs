const fs = require('fs');

let sim = fs.readFileSync('src/components/SimuladorIA.tsx', 'utf8');

// The small tags in IA result
sim = sim.replace(/border-wero-black px-3 py-1\.5/g, 'border-wero-black px-3 py-1.5 organic-blob-btn');

// The absolute search dropdown
sim = sim.replace(/shadow-\[4px_4px_0_#1D1C1C\] flex flex-wrap/g, 'shadow-[4px_4px_0_#1D1C1C] organic-card flex flex-wrap');

// The "Trocar Foto" button
sim = sim.replace(/transition-colors"/g, 'transition-colors organic-blob-btn"');
// Fix overly greedy replace on transition-colors in other buttons which might duplicate, so we fix duplicates
sim = sim.replace(/organic-blob-btn organic-blob-btn/g, 'organic-blob-btn');

// The Type Toggle wrapper
sim = sim.replace(/p-1 mb-8"/g, 'p-1 mb-8 organic-blob-btn"');

// The Type Toggle buttons
sim = sim.replace(/transition-all \$\{modo === 'manual'/g, 'transition-all organic-blob-btn ${modo === \\\'manual\\\'');
sim = sim.replace(/transition-all \$\{modo === 'scan'/g, 'transition-all organic-blob-btn ${modo === \\\'scan\\\'');
sim = sim.replace(/transition-all \$\{tipoBazar === 'fixo'/g, 'transition-all organic-blob-btn ${tipoBazar === \\\'fixo\\\'');
sim = sim.replace(/transition-all \$\{tipoBazar === 'mega'/g, 'transition-all organic-blob-btn ${tipoBazar === \\\'mega\\\'');

// State chooser buttons
sim = sim.replace(/transition-all \$\{estado === es\.id/g, 'transition-all organic-card ${estado === es.id');

fs.writeFileSync('src/components/SimuladorIA.tsx', sim);
