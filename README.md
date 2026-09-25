# Translation, in motion

An interactive MBIO 240 lesson showing mRNA entry, initiation, the A → P → E elongation cycle, termination, and a final ubiquitin structure based on PDB 1UBQ.

**Open the hosted lesson:** https://danieltsao0103.github.io/mrna-translation-lab/

The published site is in [`docs/`](docs/). To run a local copy, download or clone the repository and open `docs/index.html` directly in a browser. It does not need a server or internet connection.

To rebuild the site from the editable source:

```sh
npm ci
npm run build
```

The example mRNA encodes the 76-residue ubiquitin monomer followed by UAA. Choose Cell pace for 9 amino acids per second during elongation; initiation and termination timing in this mode are illustrative. The lesson also has slower teaching playback with detailed first and second A → P → E cycles. The fold transition is illustrative; the default final Cα backbone follows measured 1UBQ coordinates. Switch the finished structure to ribbon, heavy-atom ball-and-stick, or space-filling view. The 20-amino-acid reference gives representative DNA coding-strand, mRNA, and tRNA triplets alongside approximate free-amino-acid pKa and pI values. The bundled Three.js library is distributed under the license in [`THREE-LICENSE.txt`](THREE-LICENSE.txt).
