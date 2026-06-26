const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/border-wero-black p-6 bg-wero-white/g, 'border-wero-black p-6 bg-wero-white organic-card');
app = app.replace(/p-6 bg-wero-yellow shadow-wero flex/g, 'p-6 bg-wero-yellow shadow-wero organic-card flex');
app = app.replace(/p-6 bg-wero-green shadow-wero flex/g, 'p-6 bg-wero-green shadow-wero organic-card flex');
app = app.replace(/p-6 md:p-8 bg-wero-carrot/g, 'p-6 md:p-8 bg-wero-carrot organic-card');
app = app.replace(/px-3 py-1 uppercase tracking-wider mb-6/g, 'px-3 py-1 uppercase tracking-wider mb-6 organic-blob-btn');
app = app.replace(/px-3 py-1 border-2 border-wero-black bg-wero-white whitespace-nowrap/g, 'px-3 py-1 border-2 border-wero-black bg-wero-white whitespace-nowrap organic-blob-btn');
app = app.replace(/overflow-hidden \$\{open \? 'shadow-wero-pink' : 'shadow-wero'\}/g, 'overflow-hidden organic-card ${open ? \\\'shadow-wero-pink\\\' : \\\'shadow-wero\\\'}');
app = app.replace(/px-2 py-1 uppercase/g, 'px-3 py-2 uppercase organic-blob-btn');
app = app.replace(/bg-wero-yellow px-2 py-1 mb-6/g, 'bg-wero-yellow px-3 py-2 mb-6 organic-blob-btn');
app = app.replace(/bg-wero-green px-2 py-1 mb-6/g, 'bg-wero-green px-3 py-2 mb-6 organic-blob-btn');
fs.writeFileSync('src/App.tsx', app);

let sim = fs.readFileSync('src/components/SimuladorIA.tsx', 'utf8');
sim = sim.replace(/shadow-\[8px_8px_0_#1D1C1C\] w-full/g, 'shadow-[8px_8px_0_#1D1C1C] organic-card w-full');
sim = sim.replace(/shadow-\[8px_8px_0_#1D1C1C\] overflow-hidden/g, 'shadow-[8px_8px_0_#1D1C1C] organic-card overflow-hidden');
sim = sim.replace(/bg-wero-grey\/30 border-2 border-wero-black p-6/g, 'bg-wero-grey/30 border-2 border-wero-black p-6 organic-card');
sim = sim.replace(/w-12 h-12 shrink-0 bg-wero-black/g, 'w-12 h-12 shrink-0 organic-blob bg-wero-black');
sim = sim.replace(/w-full p-4 border-2 border-wero-black/g, 'w-full p-4 border-2 border-wero-black organic-blob-btn');
sim = sim.replace(/className=\"w-full mt-6 p-5 border-2 border-wero-black/g, 'className=\"w-full mt-6 p-5 border-2 border-wero-black organic-blob-btn');
sim = sim.replace(/bg-wero-white hover:bg-wero-yellow font-impact uppercase text-lg transition-colors/g, 'bg-wero-white hover:bg-wero-yellow font-impact uppercase text-lg transition-colors organic-blob-btn');
sim = sim.replace(/p-3 border-2 border-wero-black text-left flex items-start gap-2 transition-all/g, 'p-3 border-2 border-wero-black text-left flex items-start gap-2 transition-all organic-card');
sim = sim.replace(/px-4 py-2 border-2 border-wero-black font-classic/g, 'px-4 py-3 border-2 border-wero-black font-classic organic-blob-btn');
fs.writeFileSync('src/components/SimuladorIA.tsx', sim);
