const fs = require('fs');

let code = fs.readFileSync('src/components/SimuladorIA.tsx', 'utf8');

// Replace export default function SimuladorIA with export default function ProdutoForm
code = code.replace('export default function SimuladorIA()', 'export default function ProdutoForm()');

// Write to a new file so I can review or directly to ProdutoForm
fs.writeFileSync('src/components/ProdutoForm.tsx.tmp', code);
