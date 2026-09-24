# Translation, in motion

An interactive MBIO 240 lesson showing mRNA entry, initiation, the A → P → E elongation cycle, termination, and a final ubiquitin ribbon based on PDB 1UBQ.

**Open the hosted lesson:** https://danieltsao0103.github.io/mrna-translation-lab/

The published site is in [`docs/`](docs/). To run a local copy, download or clone the repository and open `docs/index.html` directly in a browser. It does not need a server or internet connection.

To rebuild the site from the editable source:

```sh
npm ci
npm run build
```

The example mRNA encodes the 76-residue ubiquitin monomer followed by UAA. The fold transition is illustrative; the final ribbon follows the measured 1UBQ backbone. The 20-amino-acid reference uses representative codon and tRNA pairings. The bundled Three.js library is distributed under the license in [`THREE-LICENSE.txt`](THREE-LICENSE.txt).
