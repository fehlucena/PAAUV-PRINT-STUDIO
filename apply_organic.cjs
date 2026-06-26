const fs = require('fs');

let app = fs.readFileSync('src/components/Guide.tsx', 'utf8');

// Apply organic classes based on what was in App.tsx originally
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
app = app.replace(/wero-card bg-wero-white p-6/g, 'wero-card bg-wero-white p-6 organic-card');
app = app.replace(/border-2 border-wero-black p-8 shadow-wero bg/g, 'border-2 border-wero-black p-8 shadow-wero organic-card bg');
app = app.replace(/border-2 border-wero-black p-8 shadow-wero-pink bg-wero-pink/g, 'border-2 border-wero-black p-8 shadow-wero-pink organic-card bg-wero-pink');
app = app.replace(/border-2 border-wero-black p-8 shadow-wero-blue bg-wero-black/g, 'border-2 border-wero-black p-8 shadow-wero-blue organic-card bg-wero-black');
app = app.replace(/border-2 border-wero-black p-8 bg-wero-white shadow-wero/g, 'border-2 border-wero-black p-8 bg-wero-white shadow-wero organic-card');
app = app.replace(/border-2 border-wero-black bg-wero-white transition-all/g, 'border-2 border-wero-black bg-wero-white transition-all organic-card');

fs.writeFileSync('src/components/Guide.tsx', app);
