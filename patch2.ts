import fs from 'fs';

let content = fs.readFileSync('src/components/SimuladorIA.tsx', 'utf8');

if (!content.includes('import { avaliarLocal }')) {
  content = content.replace(
    "import { motion, AnimatePresence } from 'motion/react';",
    "import { motion, AnimatePresence } from 'motion/react';\nimport { avaliarLocal } from '../lib/fastEval';"
  );
  fs.writeFileSync('src/components/SimuladorIA.tsx', content);
}
