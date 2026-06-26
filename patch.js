import fs from 'fs';

let content = fs.readFileSync('src/components/SimuladorIA.tsx', 'utf8');

if (!content.includes('avaliarLocal')) {
  content = content.replace(
    'import { useState, useRef } from "react";',
    'import { useState, useRef } from "react";\nimport { avaliarLocal } from "../lib/fastEval";'
  );
  
  content = content.replace(
    'const avaliar = async () => {\n    if (!cat) { setError("Selecione a categoria."); return; }\n    if (!estado) { setError("Selecione o estado da peça."); return; }\n    setError(""); setLoading(true);\n    const txt',
    `const avaliar = async () => {
    if (!cat) { setError("Selecione a categoria."); return; }
    if (!estado) { setError("Selecione o estado da peça."); return; }
    setError(""); setLoading(true);

    if (!image) {
      setTimeout(() => {
        const result = avaliarLocal({ cat, estado, marcaFinal, semMarca, apelo, tipoBazar });
        onResult(result);
        setLoading(false);
      }, 400);
      return;
    }
    const txt`
  );

  fs.writeFileSync('src/components/SimuladorIA.tsx', content);
}
