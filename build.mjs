import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(root, 'docs');
const threeToOne = {
  ALA:'A', ARG:'R', ASN:'N', ASP:'D', CYS:'C', GLN:'Q', GLU:'E', GLY:'G',
  HIS:'H', ILE:'I', LEU:'L', LYS:'K', MET:'M', PHE:'F', PRO:'P', SER:'S',
  THR:'T', TRP:'W', TYR:'Y', VAL:'V'
};

// Parse the first experimental 1UBQ model and retain its heavy-atom coordinates.
const pdb = await readFile(resolve(root, '1UBQ.pdb'), 'utf8');
const atomLines = pdb.split('\n').filter(line => line.startsWith('ATOM  '));
const atoms = [];
const ca = [];
const seenResidues = new Set();
let sequence = '';
for (const line of atomLines) {
  if (line.slice(21, 22) !== 'A') continue;
  const alt = line.slice(16, 17);
  if (alt !== ' ' && alt !== 'A') continue;
  const element = line.slice(76, 78).trim().toUpperCase();
  if (!['C','N','O','S'].includes(element)) continue;
  const resNum = Number(line.slice(22, 26).trim());
  const residue = line.slice(17, 20).trim();
  const name = line.slice(12, 16).trim();
  const xyz = [Number(line.slice(30, 38)), Number(line.slice(38, 46)), Number(line.slice(46, 54))];
  if (!seenResidues.has(resNum)) {
    sequence += threeToOne[residue] || '';
    seenResidues.add(resNum);
  }
  atoms.push({ e: element, n: name, r: resNum, p: xyz });
  if (name === 'CA') ca.push({ r: resNum, p: xyz });
}
if (sequence.length !== 76 || ca.length !== 76 || atoms.length < 600) throw Error('Unexpected 1UBQ structure data');
const structure = { pdb: '1UBQ', sequence, atoms, ca };
await writeFile(resolve(root, 'src/structure.json'), JSON.stringify(structure));
await mkdir(output, { recursive: true });
await build({
  entryPoints: [resolve(root, 'src/main.js')],
  outfile: resolve(output, 'app.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['chrome100','safari16','firefox100'],
  legalComments: 'none'
});
await copyFile(resolve(root, 'src/index.html'), resolve(output, 'index.html'));
await copyFile(resolve(root, 'src/styles.css'), resolve(output, 'styles.css'));
await writeFile(resolve(output, 'README.txt'), 'Translation, in motion.\n\nDouble-click index.html to open the website. All visuals and data are bundled locally; no internet connection or server is needed.\n\nWatch the mRNA thread through the ribosome. Initiation and the first two A-to-P-to-E cycles play slowly, then the cycle repeats quickly. Pause to inspect the current codon, anticodon, amino acid, and action. At UAA, a release factor enters the A site and frees the chain.\n\nThe example RNA encodes the 76-residue ubiquitin monomer. The final C-alpha backbone follows 1UBQ coordinates; switch it to ribbon, heavy-atom ball-and-stick, or space-filling view. The folding motion is illustrative. The amino-acid reference includes a DNA coding triplet and free-amino-acid pKa/pI values for each representative pairing.\n');
console.log(`Built ${output}`);
