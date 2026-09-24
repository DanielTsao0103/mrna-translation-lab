import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import structure from './structure.json';
import aminoStructures from './amino-structures.json';

const AA = {
  A:{name:'Alanine',abbr:'Ala',codon:'GCU',kind:'Nonpolar',side:'Its side chain is one methyl group (–CH₃).'},
  R:{name:'Arginine',abbr:'Arg',codon:'CGU',kind:'Basic',side:'Its guanidinium group usually carries a positive charge near pH 7.'},
  N:{name:'Asparagine',abbr:'Asn',codon:'AAU',kind:'Polar',side:'Its carboxamide group can donate and accept hydrogen bonds.'},
  D:{name:'Aspartate',abbr:'Asp',codon:'GAU',kind:'Acidic',side:'Its short carboxylate side chain is usually negatively charged near pH 7.'},
  C:{name:'Cysteine',abbr:'Cys',codon:'UGU',kind:'Polar',side:'Its thiol (–SH) can form a disulfide bond with another cysteine.'},
  Q:{name:'Glutamine',abbr:'Gln',codon:'CAA',kind:'Polar',side:'Its carboxamide sits one methylene group farther out than asparagine’s.'},
  E:{name:'Glutamate',abbr:'Glu',codon:'GAA',kind:'Acidic',side:'Its carboxylate is one methylene group longer than aspartate’s.'},
  G:{name:'Glycine',abbr:'Gly',codon:'GGU',kind:'Nonpolar',side:'Its side group is a single hydrogen atom, leaving no side-chain carbon.'},
  H:{name:'Histidine',abbr:'His',codon:'CAU',kind:'Basic',side:'Its imidazole ring can gain or lose a proton near neutral pH.'},
  I:{name:'Isoleucine',abbr:'Ile',codon:'AUU',kind:'Nonpolar',side:'Its hydrocarbon side chain branches at the β carbon.'},
  L:{name:'Leucine',abbr:'Leu',codon:'CUG',kind:'Nonpolar',side:'Its hydrocarbon side chain branches at the γ carbon.'},
  K:{name:'Lysine',abbr:'Lys',codon:'AAA',kind:'Basic',side:'Its terminal ε-amino group usually carries a positive charge near pH 7.'},
  M:{name:'Methionine',abbr:'Met',codon:'AUG',kind:'Nonpolar',side:'Its sulfur atom sits inside a thioether side chain.'},
  F:{name:'Phenylalanine',abbr:'Phe',codon:'UUU',kind:'Nonpolar',side:'Its side chain ends in a hydrophobic phenyl ring.'},
  P:{name:'Proline',abbr:'Pro',codon:'CCU',kind:'Nonpolar',side:'Its ring bonds back to the backbone nitrogen and limits rotation.'},
  S:{name:'Serine',abbr:'Ser',codon:'UCU',kind:'Polar',side:'Its short side chain ends in a hydroxyl group (–OH).'},
  T:{name:'Threonine',abbr:'Thr',codon:'ACU',kind:'Polar',side:'Its β carbon carries both a hydroxyl and a methyl group.'},
  W:{name:'Tryptophan',abbr:'Trp',codon:'UGG',kind:'Nonpolar',side:'Its large indole side chain has two fused rings.'},
  Y:{name:'Tyrosine',abbr:'Tyr',codon:'UAU',kind:'Polar',side:'Its phenyl ring carries a phenolic hydroxyl group.'},
  V:{name:'Valine',abbr:'Val',codon:'GUU',kind:'Nonpolar',side:'Its isopropyl side chain branches at the β carbon.'}
};
// Free-amino-acid values at 25 °C from Vanderbilt Chemistry; protein environments can shift pKa.
const chemistry={
  A:[2.35,9.87,null,6.11],R:[1.82,8.99,12.48,10.76],N:[2.14,8.72,null,5.43],D:[1.99,9.90,3.90,2.98],
  C:[1.92,10.70,8.37,5.15],Q:[2.17,9.13,null,5.65],E:[2.10,9.47,4.07,3.08],G:[2.35,9.78,null,6.06],
  H:[1.80,9.33,6.04,7.64],I:[2.32,9.76,null,6.04],L:[2.33,9.74,null,6.04],K:[2.16,9.06,10.54,9.47],
  M:[2.13,9.28,null,5.71],F:[2.20,9.31,null,5.76],P:[1.95,10.64,null,6.30],S:[2.19,9.21,null,5.70],
  T:[2.09,9.10,null,5.60],W:[2.46,9.41,null,5.88],Y:[2.20,9.21,10.46,5.63],V:[2.29,9.74,null,6.02]
};
for(const [letter,[carboxyl,amino,side,pI]] of Object.entries(chemistry))AA[letter].chemistry={carboxyl,amino,side,pI};
const complement = {A:'U',U:'A',G:'C',C:'G'};
const baseNames = {A:'Adenine',U:'Uracil',G:'Guanine',C:'Cytosine'};
const baseColors = {A:0xc9e9ad,U:0xf0c18c,G:0xa4ccd4,C:0xd9b8ce};
const sequence = structure.sequence;
const codons = [...sequence].map(letter => AA[letter].codon).concat('UAA');
const codonText = codons.join('');
// Spend real teaching time on initiation and two complete cycles, then compress repetition.
const playbackSegments = [
  {start:0,end:1,seconds:8,label:'initiation'},
  {start:1,end:2,seconds:11,label:'first cycle'},
  {start:2,end:3,seconds:11,label:'second cycle'},
  {start:3,end:76,seconds:73*.3,label:'rapid repetition'},
  {start:76,end:77,seconds:9,label:'stop and release'}
];
let totalSeconds=0;
for(const segment of playbackSegments){segment.at=totalSeconds;totalSeconds+=segment.seconds;}
function secondsToProgress(seconds){for(const part of playbackSegments){if(seconds<=part.at+part.seconds)return part.start+(seconds-part.at)/part.seconds*(part.end-part.start);}return 77;}
function progressToSeconds(progress){for(const part of playbackSegments){if(progress<=part.end)return part.at+(progress-part.start)/(part.end-part.start)*part.seconds;}return totalSeconds;}
if (sequence.length !== 76 || codons.length !== 77 || !sequence.startsWith('M') || ![...sequence].every(letter => AA[letter])) throw new Error('Invalid lesson sequence');
if ([...sequence].some((letter,index) => AA[letter].codon.length !== 3 || (index === 0 && AA[letter].codon !== 'AUG'))) throw new Error('Invalid codon mapping');

const $ = id => document.getElementById(id);
const dom = {
  scene:$('scene'),sceneWrap:$('scene-wrap'),fallback:$('scene-fallback'),hover:$('hover-label'),structureModes:$('structure-modes'),
  phase:$('stage-phase'),codon:$('scene-codon'),amino:$('scene-amino'),chain:$('scene-chain-count'),caption:$('scene-caption'),
  play:$('play'),playIcon:$('play-icon'),playText:$('play-text'),timeline:$('timeline'),speed:$('speed'),
  count:$('progress-count'),progressPhase:$('progress-phase'),track:$('sequence-track'),
  inspectorKicker:$('inspector-kicker'),inspectorTitle:$('inspector-title'),inspectorDescription:$('inspector-description'),
  inspectorFact:$('inspector-fact'),inspectorData:$('inspector-data'),pauseReadout:$('pause-readout'),pinState:$('pin-state'),unpin:$('unpin'),
  catalogGrid:$('catalog-grid'),catalogLetter:$('catalog-letter'),catalogAbbr:$('catalog-abr'),catalogName:$('catalog-name'),
  catalogDescription:$('catalog-description'),catalogDNA:$('catalog-dna'),catalogCodon:$('catalog-codon'),catalogAnticodon:$('catalog-anticodon'),
  catalogClass:$('catalog-class'),catalogPI:$('catalog-pi'),catalogPKACarboxyl:$('catalog-pka-carboxyl'),catalogPKAAmino:$('catalog-pka-amino'),catalogPKASide:$('catalog-pka-side'),catalogNote:$('catalog-note')
};
const state = {progress:0,playheadSeconds:0,playing:false,speed:1,pinned:null,hovered:null,selectedAA:'M',structureMode:'backbone',reduceMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
dom.timeline.max=String(totalSeconds);
const objectOptions=[...$('object-select').options].map(option=>option.cloneNode(true));
const sourceLine = 'Example RNA · 5′→3′';
let aminoPreview=null;

function detail(id,kicker,title,description,fact,rows=[]){return {id,kicker,title,description,fact,rows};}
function dnaCodon(codon){return codon.replaceAll('U','T');}
function aminoDetail(letter,index=null){const aa=AA[letter],chem=aa.chemistry;return detail(`aa-${letter}-${index??'catalog'}`,'AMINO ACID',`${aa.name} · ${aa.abbr}`,`${aa.kind}. ${aa.side}`,`pI and pKa values describe the free amino acid; the local environment can change them in a protein.`,[['Class',aa.kind],['DNA coding 5′→3′',dnaCodon(aa.codon)],['mRNA 5′→3′',aa.codon],['tRNA 3′→5′',anticodon(aa.codon)],['pI',chem.pI.toFixed(2)],['α-COOH pKa',chem.carboxyl.toFixed(2)],['α-NH₃⁺ pKa',chem.amino.toFixed(2)],...(chem.side===null?[]:[['Side-chain pKa',chem.side.toFixed(2)]]),...(index===null?[]:[['Chain position',String(index+1)]])]);}
function codonDetail(index){const codon=codons[index],stop=index===76,letter=sequence[index];return detail(`codon-${index}`,stop?'TERMINATION SIGNAL':'mRNA CODON',`${codon} ${stop?'· stop':`· ${AA[letter].name}`}`,stop?'This triplet does not specify an amino acid. It signals that translation should end.':`Bases ${index*3+1}–${index*3+3} of this example message encode ${AA[letter].name}.`,`Codon ${index+1} of 77 · read from 5′ to 3′.`,[['Position',String(index+1)],['Bases',codon],['Result',stop?'Stop':AA[letter].abbr]]);}
function baseDetail(base,index,baseIndex){return detail(`base-${index}-${baseIndex}`,'RNA NUCLEOTIDE',`${baseNames[base]} · ${base}`,`${baseNames[base]} is one of RNA’s four nucleotide bases. The ribosome reads it as part of a three-base codon.`,`This is base ${baseIndex+1} of codon ${index+1}. RNA uses uracil (U) instead of thymine (T).`,[['Codon',codons[index]],['Absolute position',String(index*3+baseIndex+1)]]);}
function trnaDetail(index){const letter=sequence[index],aa=AA[letter],codon=codons[index];return detail(`trna-${index}`,'TRANSFER RNA',`${aa.abbr}-tRNA`,index===0?'The initiator tRNA pairs with AUG and begins in the P site.':`This tRNA carries ${aa.name} to the A site, pairs with ${codon}, then moves through P and E.`,`The anticodon is written 3′→5′ so it aligns with the 5′→3′ mRNA codon.`,[['DNA coding',dnaCodon(codon)],['mRNA codon',codon],['tRNA anticodon',anticodon(codon)],['Cargo',aa.name]]);}
function anticodon(codon){return [...codon].map(base=>complement[base]).join('');}
function siteDetail(site){const labels={E:['Exit site','An empty tRNA briefly occupies E before leaving the ribosome.'],P:['Peptidyl site','P holds the tRNA carrying the growing polypeptide chain.'],A:['Aminoacyl site','A accepts the incoming tRNA that matches the next codon.']};const [title,description]=labels[site];return detail(`site-${site}`,'RIBOSOME SITE',`${site} · ${title}`,description,site==='P'?'The initiator tRNA starts here.':'During elongation, tRNAs normally progress A → P → E.',[['Site',site],['Role',title]]);}
const ribosomeDetail=detail('ribosome','RIBOSOME','The protein-making machine','The ribosome holds the mRNA and tRNAs in precise positions while amino acids are linked.','Its two subunits create the A, P, and E tRNA binding sites.',[['Reads','mRNA codons'],['Builds','Polypeptide chain']]);
const mrnaDetail=detail('mrna','MESSENGER RNA','A coded message','This example mRNA contains 76 amino-acid codons followed by a UAA stop codon.','Its 231 bases are read in groups of three, moving 5′ → 3′.',[['Bases','A · U · G · C'],['Length','231 bases']]);
const chainDetail=detail('chain','POLYPEPTIDE','A chain under construction','The ribosome joins amino acids with peptide bonds. The chain grows as each codon is translated.','The precise order of amino acids determines the protein’s possible structure.',[['Target length','76 residues'],['Bond','Peptide bond']]);
const proteinDetail=detail('protein','FINISHED PROTEIN','Ubiquitin, folded','The folded structure uses measured coordinates from Protein Data Bank entry 1UBQ. Switch between the Cα trace, ribbon, heavy-atom ball-and-stick, and space-filling views.','The folding motion is illustrative. The atom views omit hydrogen atoms because they are absent from this 1UBQ coordinate set.',[['Residues','76'],['Structure','PDB 1UBQ'],['Coordinates','Experimental']]);
const releaseFactorDetail=detail('releaseFactor','TERMINATION','Release factor','At UAA, a protein release factor recognizes the stop codon in the A site. No tRNA reads this codon.','The factor promotes hydrolysis of the bond linking the completed chain to the P-site tRNA.',[['Signal','UAA'],['Site','A'],['Result','Chain release']]);

function showDetail(item,pinned=false){
  const key=`${item.id}:${pinned}`;
  if(showDetail.lastKey===key)return;
  showDetail.lastKey=key;
  dom.inspectorKicker.textContent=item.kicker;
  dom.inspectorTitle.textContent=item.title;
  dom.inspectorDescription.textContent=item.description;
  dom.inspectorFact.innerHTML='<span class="fact-line"></span><p></p>';
  dom.inspectorFact.querySelector('p').textContent=item.fact;
  dom.inspectorData.replaceChildren(...item.rows.map(([key,value])=>{const row=document.createElement('div');row.className='data-row';const a=document.createElement('span'),b=document.createElement('span');a.textContent=key;b.textContent=value;row.append(a,b);return row;}));
  dom.pinState.textContent=pinned?'DETAIL PINNED':'FOLLOWING THE ANIMATION';
  dom.unpin.hidden=!pinned;
}
function currentDetail(){
  const p=state.progress;
  if(p<.14)return detail('intro','THE MESSAGE','One message, read in threes.','The full mRNA contains 231 RNA bases. The ribosome will read them as 77 three-base codons.','The animation follows the process; pause anywhere to inspect the exact codon and carrier.');
  if(p<1)return detail('initiation','INITIATION','The message enters.','The mRNA threads through the ribosome until AUG sits in the P site. The initiator tRNA pairs with it.','AUG establishes the reading frame for every codon that follows.',[['Start codon','AUG'],['Initiator site','P']]);
  if(state.playing&&p>=3&&p<76)return detail('rapid-repeat','ELONGATION · RAPID REPEAT','The cycle repeats.','An incoming tRNA pairs at A. A peptide bond lengthens the chain. The mRNA and tRNAs move together by one codon, and an empty tRNA leaves at E.','Pause to reveal the exact codon, anticodon, residue, and action at any frame.',[['Incoming','A site'],['Growing chain','P site'],['Departure','E site']]);
  if(state.playing&&p<3){const step=p%1,cycle=Math.floor(p),stage=step<.26?0:step<.44?1:step<.62?2:3;const titles=['A new tRNA arrives.','The anticodon pairs.','A peptide bond forms.','The message advances.'];const descriptions=['A charged tRNA moves into the A site beside the tRNA already in P.','Three anticodon bases on the incoming tRNA align with the mRNA codon.','The growing chain is transferred to the amino acid held at A.','The tRNAs shift toward P and E while the mRNA slides one codon through the ribosome.'];return detail(`slow-${cycle}-${stage}`,'ELONGATION · SLOW MOTION',titles[stage],descriptions[stage],`Cycle ${cycle} of 2 is shown slowly so you can follow all three ribosome sites.`,[['Path','A → P → E'],['mRNA step','Three bases']]);}
  if(p<76){const i=Math.floor(p),aa=AA[sequence[i]];return detail(`current-${i}`,'PAUSED ELONGATION',`Codon ${i+1}: ${codons[i]}.`,`A matching tRNA brings ${aa.name} to the A site. A peptide bond adds it to the chain, then the tRNAs and mRNA move together.`,`This frame is paused so you can inspect the exact molecular details.`,[['Anticodon',anticodon(codons[i])],['Amino acid',aa.name],['Path','A → P → E']]);}
  if(p<76.45)return detail('stop','TERMINATION','A stop signal arrives.','UAA is a stop codon. It does not recruit a tRNA or add an amino acid.','A release factor recognizes the stop signal and frees the completed chain.',[['Codon','UAA'],['Chain','76 amino acids']]);
  return proteinDetail;
}
function visibleParts(progress=state.progress){
  const fold=Math.max(0,Math.min(1,(progress-76.44)/.56));
  const entry=THREE.MathUtils.smoothstep(progress,.1,.63);
  const ribosome=entry>.12&&fold<.88;
  return {
    mrna:progress<.48||ribosome,
    ribosome,
    E:ribosome,P:ribosome,A:ribosome,
    trna:ribosome&&progress>=.23&&progress<76.68,
    releaseFactor:ribosome&&progress>76.1&&progress<76.76,
    residue:progress<76&&progress>=.23,
    chain:chainCount(progress)>0&&fold<.995,
    protein:fold>.76
  };
}
function isDetailPresent(item){
  if(!item)return false;
  const p=state.progress,parts=visibleParts(p),id=item.id;
  if(id==='protein')return parts.protein;
  if(id==='chain')return parts.chain;
  if(id==='mrna')return parts.mrna;
  if(id==='ribosome')return parts.ribosome;
  if(id==='releaseFactor')return parts.releaseFactor;
  if(id.startsWith('site-'))return parts[id.slice(5)];
  // All codons and bases remain visible in the separate full-sequence strip.
  if(id.startsWith('codon-')||id.startsWith('base-'))return true;
  if(id.startsWith('trna-')){
    if(!parts.trna)return false;
    const trnaIndex=Number(id.slice(5)),active=Math.min(76,Math.floor(p));
    if(active===0)return trnaIndex===0;
    if(active===76)return trnaIndex===75;
    return trnaIndex===active||trnaIndex===active-1||trnaIndex===active-2&&p%1<.82;
  }
  if(id.startsWith('aa-')){
    const residue=id.split('-')[2];
    if(residue==='catalog')return true;
    const residueIndex=Number(residue);
    return parts.protein&&state.structureMode==='backbone'||parts.chain&&residueIndex<chainCount(p)||parts.residue&&residueIndex===Math.floor(p);
  }
  return true;
}
function refreshInspector(){
  if(state.pinned&&!isDetailPresent(state.pinned))state.pinned=null;
  if(state.hovered&&!isDetailPresent(state.hovered))state.hovered=null;
  showDetail(state.pinned||state.hovered||currentDetail(),!!state.pinned);
}
function setHovered(item,e){state.hovered=item;refreshInspector();if(item&&e){dom.hover.hidden=false;dom.hover.textContent=item.title;const rect=dom.sceneWrap.getBoundingClientRect();dom.hover.style.left=`${Math.min(rect.width-130,Math.max(8,e.clientX-rect.left+13))}px`;dom.hover.style.top=`${Math.min(rect.height-37,Math.max(8,e.clientY-rect.top+11))}px`;}else dom.hover.hidden=true;}
function pin(item){state.pinned=item;refreshInspector();}

// Every sequence triplet is a keyboard-accessible target, and the entire RNA stays available.
const codonButtons=codons.map((codon,index)=>{
  const button=document.createElement('div');button.className=`codon${index===76?' stop':''}`;
  button.setAttribute('role','group');button.setAttribute('aria-label',`Codon ${index+1}: ${codon}, ${index===76?'stop':AA[sequence[index]].name}`);
  const letters=document.createElement('span');letters.className='codon-bases';
  [...codon].forEach((base,baseIndex)=>{const span=document.createElement('button');span.type='button';span.className=`base-${base} base-button`;span.textContent=base;span.setAttribute('aria-label',`${baseNames[base]}, base ${baseIndex+1} in codon ${index+1}`);span.addEventListener('pointerenter',()=>{state.hovered=baseDetail(base,index,baseIndex);refreshInspector();});span.addEventListener('focus',()=>{state.hovered=baseDetail(base,index,baseIndex);refreshInspector();});span.addEventListener('click',e=>{e.stopPropagation();pin(baseDetail(base,index,baseIndex));});letters.append(span);});
  const number=document.createElement('button');number.type='button';number.className='codon-number';number.textContent=index===76?'STOP':String(index+1).padStart(2,'0');number.setAttribute('aria-label',`Jump to codon ${index+1}: ${codon}`);button.append(letters,number);
  function jump(){setProgress(index===76?76.2:index===0?.5:index+.22);state.playing=false;syncPlay();pin(codonDetail(index));}
  number.addEventListener('click',e=>{e.stopPropagation();jump();});button.addEventListener('click',jump);
  number.addEventListener('focus',()=>{state.hovered=codonDetail(index);refreshInspector();});
  number.addEventListener('pointerenter',()=>{state.hovered=codonDetail(index);refreshInspector();});
  button.addEventListener('pointerleave',()=>{state.hovered=null;refreshInspector();});
  button.addEventListener('blur',()=>{state.hovered=null;refreshInspector();});
  dom.track.append(button);return button;
});

const catalogOrder='ARNDCQEGHILKMFPSTWYV';
catalogOrder.split('').forEach(letter=>{
  const aa=AA[letter],button=document.createElement('button');button.className='amino-card';button.type='button';button.setAttribute('aria-label',`${aa.name}, example codon ${aa.codon}`);button.innerHTML=`<strong>${letter}</strong><span>${aa.name}</span>`;
  button.addEventListener('click',()=>selectCatalog(letter));button.addEventListener('pointerenter',()=>{state.hovered=aminoDetail(letter);refreshInspector();});button.addEventListener('focus',()=>{state.hovered=aminoDetail(letter);refreshInspector();});button.addEventListener('pointerleave',()=>{state.hovered=null;refreshInspector();});button.addEventListener('blur',()=>{state.hovered=null;refreshInspector();});dom.catalogGrid.append(button);
});
function selectCatalog(letter){
  state.selectedAA=letter;const aa=AA[letter],chem=aa.chemistry;
  dom.catalogLetter.textContent=letter;dom.catalogAbbr.textContent=`${aa.abbr.toUpperCase()} · ${letter}`;dom.catalogName.textContent=aa.name;
  dom.catalogDescription.textContent=`${aa.kind}. ${aa.side}`;
  dom.catalogDNA.textContent=dnaCodon(aa.codon);dom.catalogCodon.textContent=aa.codon;dom.catalogAnticodon.textContent=anticodon(aa.codon);
  dom.catalogClass.textContent=aa.kind;dom.catalogPI.textContent=chem.pI.toFixed(2);dom.catalogPKACarboxyl.textContent=chem.carboxyl.toFixed(2);dom.catalogPKAAmino.textContent=chem.amino.toFixed(2);dom.catalogPKASide.textContent=chem.side===null?'No listed value':chem.side.toFixed(2);
  dom.catalogNote.textContent='DNA is the coding strand, shown 5′→3′. Approximate pKa and pI values are for free amino acids at 25 °C; side-chain values are listed for seven commonly ionizable groups. Values within a protein can differ.';
  [...dom.catalogGrid.children].forEach(button=>{const active=button.querySelector('strong').textContent===letter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});renderAminoModel(letter);
}
function initAminoPreview(){
  const wrap=document.createElement('div');wrap.className='amino-model-wrap';
  const title=document.createElement('span');title.className='amino-model-label';title.textContent='3D AMINO ACID · DRAG TO ROTATE';
  const canvas=document.createElement('canvas');canvas.id='amino-model';canvas.setAttribute('aria-label','Rotatable ball-and-stick model of the selected amino acid');
  const caption=document.createElement('span');caption.className='amino-model-caption';caption.textContent='Atom colors: C green · N blue · O coral · S gold · H cream';
  wrap.append(title,canvas,caption);document.querySelector('.catalog-title-line').after(wrap);
  let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch(error){console.warn('Amino-acid WebGL preview unavailable',error);canvas.replaceWith(document.createTextNode('3D preview unavailable on this device.'));return;}renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3.2,3.2,1.7,-1.7,.1,100);camera.position.set(0,0,8);scene.add(new THREE.AmbientLight(0xffffff,2.1));const key=new THREE.DirectionalLight(0xfff3dc,2.5);key.position.set(-3,5,7);scene.add(key);const model=new THREE.Group();scene.add(model);
  const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.autoRotate=false;
  aminoPreview={wrap,canvas,renderer,scene,camera,controls,model};
  function resize(){const width=wrap.clientWidth,height=145;renderer.setSize(width,height,false);const aspect=width/height;camera.left=-1.85*aspect;camera.right=1.85*aspect;camera.top=1.85;camera.bottom=-1.85;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(wrap);resize();
  canvas.addEventListener('pointerenter',()=>{state.hovered=aminoDetail(state.selectedAA);refreshInspector();});canvas.addEventListener('pointerleave',()=>{state.hovered=null;refreshInspector();});
  let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5)pin(aminoDetail(state.selectedAA));down=null;});
}
function renderAminoModel(letter){if(!aminoPreview)return;const {model}=aminoPreview;disposeGroup(model);const source=aminoStructures[letter];if(!source)return;const points=source.atoms.map(atom=>new THREE.Vector3(...atom.p));const center=new THREE.Vector3();points.forEach(p=>center.add(p));center.divideScalar(points.length);const furthest=Math.max(...points.map(p=>p.distanceTo(center)));const scale=1.48/furthest;const coords=points.map(p=>p.sub(center).multiplyScalar(scale));const colors={C:0xa7c6a5,H:0xf2eee1,N:0x8ebbd6,O:0xe68b79,S:0xedc76e};
  source.bonds.forEach(([a,b,order])=>{const start=coords[a],end=coords[b],direction=new THREE.Vector3().subVectors(end,start),length=direction.length(),mid=new THREE.Vector3().addVectors(start,end).multiplyScalar(.5);const normal=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,0,1)).normalize();const count=order===2?2:1;for(let i=0;i<count;i++){const bond=new THREE.Mesh(new THREE.CylinderGeometry(.037,.037,length,7),new THREE.MeshStandardMaterial({color:0xb9cdb7,roughness:.72}));bond.position.copy(mid).addScaledVector(normal,count===2?(i?-.055:.055):0);bond.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());model.add(bond);}});
  source.atoms.forEach((atom,i)=>{const radius=atom.e==='H'?.07:atom.e==='S'?.16:.125;const bead=orb(radius,colors[atom.e],1,14);bead.position.copy(coords[i]);model.add(bead);});model.rotation.set(.14,.15,0);
}
initAminoPreview();
selectCatalog('M');
const catalogLayout=document.querySelector('.catalog-layout');
const catalogDisclosure=document.createElement('details');catalogDisclosure.className='catalog-disclosure';
const catalogSummary=document.createElement('summary');catalogSummary.innerHTML='<span>Open the 20-amino-acid reference</span><span aria-hidden="true">↗</span>';
catalogLayout.before(catalogDisclosure);catalogDisclosure.append(catalogSummary,catalogLayout);

let renderer,scene,camera,controls,raycaster,pointer,modelGroup,translationGroup,fullRNA,movingRNA,activeCodonHalo,ribosomeGroup,trnaLayer,releaseFactorGroup,chainGroup,foldGroup,ballStickGroup,spaceFillGroup,particles;
let currentMeshes=[],foldMaterials=[],ribosomeMaterials=[],chainBeads=[],chainBond,backboneTube;
const trnaCache=new Map();
let hoverPick=null,hoverRoot=null,lastScenePointer=null,lastHoverSample=0;
let hoverBackups=[];
let cachedCodonIndex=-99,lastSelection=-1;
const siteX={E:-2.45,P:0,A:2.45};
const codonSpacing=2.45;
const up=new THREE.Vector3(0,1,0);
function setPick(object,item,priority=1){object.userData.detail=item;object.userData.priority=priority;return object;}
function orb(radius,color,opacity=1,segments=16){return new THREE.Mesh(new THREE.SphereGeometry(radius,segments,Math.max(10,segments/2)),new THREE.MeshStandardMaterial({color,roughness:.78,metalness:0,transparent:opacity<1,opacity}));}
function organic(x,y,z,sx,sy,sz,color,opacity){const geo=new THREE.SphereGeometry(1,40,30),pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const vx=pos.getX(i),vy=pos.getY(i),vz=pos.getZ(i),wave=1+.07*Math.sin(vx*9+vy*5)*Math.sin(vz*7-vy*3)+.035*Math.cos(vx*17+vz*9);pos.setXYZ(i,vx*wave,vy*wave,vz*wave);}geo.computeVertexNormals();const material=new THREE.MeshPhysicalMaterial({color,roughness:.92,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});ribosomeMaterials.push([material,opacity]);const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);setPick(mesh,ribosomeDetail,1);return mesh;}
function tube(points,radius,color,opacity=1){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*9),radius,7,false),new THREE.MeshStandardMaterial({color,roughness:.82,transparent:opacity<1,opacity}));}
function textSprite(text,color='#f7f8e9',bg='rgba(38,75,59,.86)',scale=[1.35,.62]){const c=document.createElement('canvas');c.width=300;c.height=138;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(10,10,280,118,37);ctx.fill();ctx.fillStyle=color;ctx.font='bold 63px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,150,75);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(...scale,1);return sprite;}
function disposeGroup(group){while(group.children.length){const object=group.children[0];group.remove(object);object.traverse(child=>{child.geometry?.dispose();if(child.material){if(Array.isArray(child.material))child.material.forEach(mat=>{mat.map?.dispose();mat.dispose();});else{child.material.map?.dispose();child.material.dispose();}}});}}

function makeTRNA(index){const aa=AA[sequence[index]],codon=codons[index];const group=new THREE.Group();const tint=aa.kind==='Acidic'?0xd89b78:aa.kind==='Basic'?0x9bbae1:aa.kind==='Aromatic'?0xe4bc88:0xe3aa80;
  const stem=tube([[0,0,0],[.02,.5,0],[.16,.97,0],[.48,1.16,.02],[.93,1.17,.05],[1.34,1.3,.08],[1.56,1.84,.1]],.085,0xd6a480);setPick(stem,trnaDetail(index),4);group.add(stem);
  const arm=tube([[.16,.97,0],[-.17,1.15,0],[-.56,1.23,-.05],[-.7,1.5,-.05]],.075,0xe9bc93);setPick(arm,trnaDetail(index),4);group.add(arm);
  for(let j=0;j<3;j++){const bead=orb(.13,baseColors[anticodon(codon)[j]],1,12);bead.position.set((j-1)*.28,-.05,.13);setPick(bead,trnaDetail(index),5);group.add(bead);}
  // Three short bridges align the 3′→5′ anticodon with the 5′→3′ mRNA codon.
  const pairing=new THREE.Group();
  for(let j=0;j<3;j++){const bridge=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.75,7),new THREE.MeshBasicMaterial({color:0xffedb9,transparent:true,opacity:0,depthWrite:false}));bridge.position.set((j-1)*.31,-.45,.015);bridge.rotation.z=(j-1)*.08;setPick(bridge,trnaDetail(index),5);pairing.add(bridge);}
  group.add(pairing);
  const cargo=orb(.22,tint,1,16);cargo.position.set(1.58,1.87,.1);setPick(cargo,aminoDetail(sequence[index],index),6);group.add(cargo);group.userData.cargo=cargo;group.userData.pairing=pairing;group.userData.index=index;group.traverse(object=>{if(object!==group&&object!==cargo)object.userData.highlightRoot=group;});return group;
}
function buildMovingRNA(){
  movingRNA=new THREE.Group();translationGroup.add(movingRNA);
  const end=76*codonSpacing;
  const backbone=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,end+2.3,12),new THREE.MeshStandardMaterial({color:0x385e57,roughness:.8}));
  backbone.rotation.z=Math.PI/2;backbone.position.set(end/2,-1.29,1.92);setPick(backbone,mrnaDetail,2);movingRNA.add(backbone);
  const glyphTemplates=Object.fromEntries(Object.keys(baseColors).map(base=>[base,textSprite(base,'#204437','rgba(244,249,228,.87)',[.32,.29])]));
  codons.forEach((codon,index)=>{
    const center=index*codonSpacing;
    [...codon].forEach((base,baseIndex)=>{
      const x=center+(baseIndex-1)*.34;
      const baseGroup=new THREE.Group();movingRNA.add(baseGroup);
      const sphere=orb(.17,baseColors[base],1,16);sphere.position.set(x,-1.24,2.28);setPick(sphere,baseDetail(base,index,baseIndex),7);sphere.userData.highlightRoot=baseGroup;baseGroup.add(sphere);
      const glyph=new THREE.Sprite(glyphTemplates[base].material);glyph.scale.copy(glyphTemplates[base].scale);glyph.position.set(x,-.94,2.48);setPick(glyph,baseDetail(base,index,baseIndex),8);glyph.userData.highlightRoot=baseGroup;baseGroup.add(glyph);
    });
  });
  activeCodonHalo=new THREE.Mesh(new THREE.TorusGeometry(.61,.039,8,32),new THREE.MeshBasicMaterial({color:0xf6ce90,transparent:true,opacity:.92,depthTest:false}));
  activeCodonHalo.position.set(0,-1.23,2.19);setPick(activeCodonHalo,codonDetail(0),5);movingRNA.add(activeCodonHalo);
}
function cachedTRNA(index){if(!trnaCache.has(index))trnaCache.set(index,makeTRNA(index));return trnaCache.get(index);}
function buildTRNAs(index){
  if(hoverPick&&trnaLayer.getObjectById(hoverPick.object.id))clearModelHighlight();
  // Reparent the same tRNA across A → P → E. Recreating meshes here caused a visible hitch.
  trnaLayer.clear();currentMeshes=[];
  const indices=index===0?[0]:index>=76?[75]:index>1?[index-1,index,index-2]:[index-1,index];
  for(const trnaIndex of indices){const group=cachedTRNA(trnaIndex);group.scale.setScalar(1);group.userData.cargo.visible=trnaIndex===index&&index<76;group.userData.pairing.visible=false;trnaLayer.add(group);currentMeshes.push(group);}
}
function setPairing(group,strength){const pairing=group?.userData.pairing;if(!pairing)return;pairing.visible=strength>.02;for(const bridge of pairing.children)bridge.material.opacity=.82*strength;}
function makeReleaseFactor(){
  const group=new THREE.Group();
  const body=orb(.42,0xe4b47b,1,24);body.scale.set(.78,1.35,.62);body.position.set(0,.42,0);setPick(body,releaseFactorDetail,6);group.add(body);
  const arm=tube([[0,.44,0],[-.29,.13,.02],[-.31,-.35,.04],[-.12,-.74,.04]],.09,0xf0c996);setPick(arm,releaseFactorDetail,6);group.add(arm);
  const tip=orb(.11,0xffdf9f,1,12);tip.position.set(-.12,-.74,.04);setPick(tip,releaseFactorDetail,7);group.add(tip);
  const label=textSprite('RF','#433b2a','rgba(255,231,180,.92)',[.8,.45]);label.position.set(.08,1.27,.17);setPick(label,releaseFactorDetail,8);group.add(label);
  group.traverse(object=>{if(object!==group)object.userData.highlightRoot=group;});group.visible=false;return group;
}
function chainPosition(j,count){const age=Math.max(0,count-1-j);return new THREE.Vector3(1.58-.10*Math.min(age,13)+.36*Math.sin(age*.47)*Math.min(1,age/3),1.49+.18*Math.min(age,13)+.012*Math.max(0,age-13),2.48+.16*Math.sin(age*.65));}
function buildChain(){for(let j=0;j<76;j++){const bead=orb(j===0?.135:.104,0xd2a676,1,12);setPick(bead,aminoDetail(sequence[j],j),8);bead.position.copy(chainPosition(j,j+1));bead.visible=false;chainGroup.add(bead);chainBeads.push(bead);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(76*3),3));chainBond=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xe8c99e,transparent:true,opacity:.9}));setPick(chainBond,chainDetail,4);chainGroup.add(chainBond);}
function makeAtomViews(xyz){
  const atoms=structure.atoms,coords=atoms.map(atom=>xyz(atom.p));
  const colors={C:0xa8c5a3,N:0x8fbbe4,O:0xea927e,S:0xe9c568};
  const ballRadius={C:.092,N:.098,O:.098,S:.13},spaceRadius={C:.306,N:.279,O:.274,S:.324};
  const sphereGeometry=new THREE.SphereGeometry(1,12,9),dummy=new THREE.Object3D();
  function atomGroup(radii){
    const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72});
    const mesh=new THREE.InstancedMesh(sphereGeometry,material,atoms.length);
    atoms.forEach((atom,i)=>{dummy.position.copy(coords[i]);dummy.quaternion.identity();dummy.scale.setScalar(radii[atom.e]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color(colors[atom.e]));});
    mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;setPick(mesh,proteinDetail,7);mesh.userData.highlightRoot=group;group.add(mesh);group.userData.atomCount=atoms.length;return group;
  }
  ballStickGroup=atomGroup(ballRadius);spaceFillGroup=atomGroup(spaceRadius);
  // Infer covalent bonds from close atoms in each residue, plus consecutive peptide C–N bonds.
  const radii={C:.77,N:.75,O:.73,S:1.02},bonds=[];
  for(let i=0;i<atoms.length;i++)for(let j=i+1;j<atoms.length;j++){
    const a=atoms[i],b=atoms[j],same=a.r===b.r;
    if(!same&&!(b.r===a.r+1&&a.n==='C'&&b.n==='N'))continue;
    const dx=a.p[0]-b.p[0],dy=a.p[1]-b.p[1],dz=a.p[2]-b.p[2],distance=Math.hypot(dx,dy,dz);
    if(distance<.9||distance>radii[a.e]+radii[b.e]+.17)continue;
    bonds.push([i,j]);
  }
  const bondMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.034,.034,1,7),new THREE.MeshStandardMaterial({color:0xdde9d9,roughness:.76}),bonds.length);
  bonds.forEach(([i,j],k)=>{const direction=coords[j].clone().sub(coords[i]);dummy.position.copy(coords[i]).add(coords[j]).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(1,direction.length(),1);dummy.updateMatrix();bondMesh.setMatrixAt(k,dummy.matrix);});
  bondMesh.instanceMatrix.needsUpdate=true;setPick(bondMesh,proteinDetail,5);bondMesh.userData.highlightRoot=ballStickGroup;ballStickGroup.add(bondMesh);ballStickGroup.userData.bondCount=bonds.length;
  ballStickGroup.visible=false;spaceFillGroup.visible=false;modelGroup.add(ballStickGroup,spaceFillGroup);
}
function makeFold(){
  foldGroup=new THREE.Group();
  const origin=new THREE.Vector3();
  for(const item of structure.ca)origin.add(new THREE.Vector3(...item.p));
  origin.divideScalar(structure.ca.length);
  const xyz=p=>new THREE.Vector3(...p).sub(origin).multiplyScalar(.18).add(new THREE.Vector3(0,.55,0));
  const ca=structure.ca.map(item=>xyz(item.p));
  foldGroup.userData.ca=ca;
  backboneTube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ca,false,'centripetal'),ca.length*6,.026,6,false),new THREE.MeshStandardMaterial({color:0xe9c99e,roughness:.7,transparent:true,opacity:0}));
  setPick(backboneTube,proteinDetail,5);chainGroup.add(backboneTube);

  // Residue ranges transcribed from the HELIX and SHEET records in 1UBQ.pdb.
  const helices=[[23,34],[56,59]];
  const sheets=[[1,7],[10,17],[40,45],[48,50],[64,72]];
  const secondary=residue=>{
    if(helices.some(([first,last])=>residue>=first&&residue<=last))return 'helix';
    if(sheets.some(([first,last])=>residue>=first&&residue<=last))return 'sheet';
    return 'loop';
  };
  const curve=new THREE.CatmullRomCurve3(ca,false,'centripetal');
  const subdivisions=8,samples=(ca.length-1)*subdivisions;
  const frames=curve.computeFrenetFrames(samples,false);
  const vertices=[],colors=[],indices=[];
  const palette={helix:new THREE.Color(0xe9ad77),sheet:new THREE.Color(0x94d2bc),loop:new THREE.Color(0xe6dfbd)};
  for(let i=0;i<=samples;i++){
    const position=curve.getPoint(i/samples),residue=1+i/subdivisions;
    const kind=secondary(Math.round(residue));
    let width=kind==='sheet'?.37:kind==='helix'?.27:.115;
    // A tapered end makes each measured beta strand read as a ribbon arrow.
    if(kind==='sheet'){
      const range=sheets.find(([first,last])=>residue>=first-.5&&residue<=last+.5);
      if(range&&residue>range[1]-.48)width*=Math.max(.07,(range[1]+.5-residue)/.98);
    }
    const side=frames.binormals[i];
    for(const direction of [-1,1]){
      const edge=position.clone().addScaledVector(side,direction*width);
      vertices.push(edge.x,edge.y,edge.z);
      const shade=direction<0?.84:1;
      const color=palette[kind].clone().multiplyScalar(shade);
      colors.push(color.r,color.g,color.b);
    }
    if(i<samples){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.63,metalness:0,transparent:true,opacity:0,depthWrite:false});
  const ribbon=new THREE.Mesh(geometry,material);
  setPick(ribbon,proteinDetail,7);foldGroup.add(ribbon);foldMaterials.push(material);

  modelGroup.add(foldGroup);makeAtomViews(xyz);
}
function makeModel(){modelGroup=new THREE.Group();scene.add(modelGroup);translationGroup=new THREE.Group();modelGroup.add(translationGroup);ribosomeGroup=new THREE.Group();translationGroup.add(ribosomeGroup);ribosomeGroup.add(organic(-1.8,-1.85,-.28,2.7,1.03,1.15,0x83a98d,.83),organic(1.42,-1.87,-.14,2.42,.97,1.06,0x86ad91,.78),organic(-1.48,.8,-.77,2.43,1.25,1.3,0x5e866e,.67),organic(1.22,1.0,-.64,2.69,1.45,1.5,0x638b70,.64),organic(.35,1.5,-1.26,2.38,.92,1.15,0x719b79,.6));ribosomeGroup.traverse(object=>{if(object!==ribosomeGroup)object.userData.highlightRoot=ribosomeGroup;});
  for(const [site,x] of Object.entries(siteX)){const siteGroup=new THREE.Group();translationGroup.add(siteGroup);const marker=textSprite(site,'#f8fff0','rgba(37,76,57,.94)',[.66,.53]);marker.position.set(x,-.26,2.85);setPick(marker,siteDetail(site),9);marker.userData.highlightRoot=siteGroup;siteGroup.add(marker);const halo=orb(.37,site==='A'?0xe6b880:0xb8ddad,.25,16);halo.position.set(x,-.2,1.45);setPick(halo,siteDetail(site),5);halo.userData.highlightRoot=siteGroup;siteGroup.add(halo);}
  buildMovingRNA();trnaLayer=new THREE.Group();translationGroup.add(trnaLayer);releaseFactorGroup=makeReleaseFactor();translationGroup.add(releaseFactorGroup);chainGroup=new THREE.Group();modelGroup.add(chainGroup);buildChain();makeFold();
  fullRNA=new THREE.Group();modelGroup.add(fullRNA);const fullPoints=[];for(let i=0;i<codonText.length;i++){const x=-4.65+i/(codonText.length-1)*9.3,y=.32*Math.sin(i*.14)+.21*Math.cos(i*.075),z=1.55+.14*Math.sin(i*.095);fullPoints.push([x,y,z]);const bead=orb(.072,baseColors[codonText[i]],1,8);bead.position.set(x,y,z);setPick(bead,baseDetail(codonText[i],Math.floor(i/3),i%3),6);fullRNA.add(bead);}const fullBackbone=tube(fullPoints.filter((_,i)=>i%3===0),.055,0x345d50,1);setPick(fullBackbone,mrnaDetail,2);fullRNA.add(fullBackbone);
  particles=new THREE.Group();for(let i=0;i<66;i++){const phi=i*2.3999,r=3.5+(i%8)*.54,x=Math.cos(phi)*r,y=Math.sin(phi*.7)*3.7,z=-2-(i%6)*.45;const mote=orb(.025+(i%3)*.009,i%4===0?0xe5e8c1:0xd7e7d5,.23,6);mote.position.set(x,y,z);particles.add(mote);}scene.add(particles);
}
function clearModelHighlight(){
  for(const backup of hoverBackups){
    if(backup.scale)backup.object.scale.copy(backup.scale);
    if(backup.color)backup.material.color.copy(backup.color);
    if(backup.emissive)backup.material.emissive.copy(backup.emissive);
    if(backup.intensity!==undefined)backup.material.emissiveIntensity=backup.intensity;
  }
  hoverBackups=[];hoverRoot=null;hoverPick=null;
}
function setModelHighlight(record){
  const root=record?.object.userData.highlightRoot||record?.object||null;
  if(hoverRoot===root&&hoverPick?.item.id===record?.item.id){hoverPick=record;return;}
  clearModelHighlight();
  if(!record)return;
  hoverPick=record;hoverRoot=root;
  const seen=new Set();
  root.traverse(object=>{
    if(object.isSprite){hoverBackups.push({object,scale:object.scale.clone()});object.scale.multiplyScalar(1.14);return;}
    const material=object.material;
    if(!material||Array.isArray(material)||seen.has(material))return;
    seen.add(material);
    const backup={material,color:material.color?.clone(),emissive:material.emissive?.clone(),intensity:material.emissiveIntensity};
    hoverBackups.push(backup);
    material.color?.lerp(new THREE.Color(0xfff1b7),.2);
    if(material.emissive){material.emissive.setHex(0xffe8aa);material.emissiveIntensity=.28;}
  });
}
function init3D(){try{renderer=new THREE.WebGLRenderer({canvas:dom.scene,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){console.warn('WebGL unavailable',error);dom.fallback.hidden=false;dom.scene.hidden=true;return;}renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.55;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(42,1,.1,100);scene.add(new THREE.AmbientLight(0xffffff,1.85));const key=new THREE.DirectionalLight(0xfff5da,2.15);key.position.set(-4,7,9);scene.add(key);const rim=new THREE.DirectionalLight(0xa1cfb1,1.25);rim.position.set(6,2,-4);scene.add(rim);controls=new OrbitControls(camera,dom.scene);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=28;controls.maxPolarAngle=Math.PI*.78;controls.minPolarAngle=Math.PI*.18;controls.target.set(0,.35,0);raycaster=new THREE.Raycaster();raycaster.params.Line.threshold=.12;pointer=new THREE.Vector2();makeModel();resize3D();new ResizeObserver(resize3D).observe(dom.sceneWrap);dom.scene.addEventListener('pointermove',onPointerMove);dom.scene.addEventListener('pointerleave',()=>{lastScenePointer=null;clearModelHighlight();setHovered(null);});let press=null;dom.scene.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY};});dom.scene.addEventListener('pointerup',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<5){const selected=pickAt(e);if(selected)pin(selected.item);}press=null;});}
function resize3D(){if(!renderer)return;const w=dom.sceneWrap.clientWidth,h=dom.sceneWrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;const halfHeight=5.8,halfWidth=5.6;const fov=camera.fov*Math.PI/180;const distance=Math.max(halfHeight/Math.tan(fov/2),halfWidth/(Math.tan(fov/2)*camera.aspect));camera.position.set(0,1.15,distance);camera.updateProjectionMatrix();controls.update();}
function isWorldVisible(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
function pickAt(event){
  if(!renderer)return null;
  const rect=dom.scene.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  for(const hit of raycaster.intersectObjects(modelGroup.children,true)){
    const object=hit.object,item=object.userData.detail;
    if(!item||!isWorldVisible(object)||!isDetailPresent(item))continue;
    if(object.material?.opacity!==undefined&&object.material.opacity<.12)continue;
    return {item,object,point:hit.point,distance:hit.distance};
  }
  return null;
}
function onPointerMove(event){
  lastScenePointer={clientX:event.clientX,clientY:event.clientY};lastHoverSample=performance.now();
  const selected=pickAt(event);
  setModelHighlight(selected);
  setHovered(selected?.item||null,event);
  dom.scene.style.cursor=selected?'pointer':'grab';
}

function update3D(){if(!renderer)return;const p=state.progress;let index=Math.floor(Math.min(p,76));if(p<1)index=0;const phase=p-index;const foldT=Math.max(0,Math.min(1,(p-76.44)/.56));if(index!==cachedCodonIndex){buildTRNAs(index);cachedCodonIndex=index;}
  const introT=THREE.MathUtils.smoothstep(p,.1,.63),active=p>=.1;translationGroup.visible=active&&foldT<.98;fullRNA.visible=p<.5;fullRNA.position.y=-.83*introT;fullRNA.scale.y=1-.4*introT;ribosomeGroup.visible=active;trnaLayer.visible=active&&p<76.8;chainGroup.visible=active;translationGroup.traverse(object=>{const mat=object.material;if(mat&&!Array.isArray(mat)){if(mat.userData.originalOpacity===undefined)mat.userData.originalOpacity=mat.opacity;mat.transparent=true;mat.opacity=mat.userData.originalOpacity*introT*(1-foldT);}});if(fullRNA.visible)fullRNA.traverse(object=>{const mat=object.material;if(mat&&!Array.isArray(mat)){if(mat.userData.originalOpacity===undefined)mat.userData.originalOpacity=mat.opacity;mat.transparent=true;mat.opacity=mat.userData.originalOpacity*(1-THREE.MathUtils.smoothstep(p,.04,.5));}});
  const f=state.reduceMotion?(phase>=.62?1:0):phase;
  const translocation=THREE.MathUtils.smoothstep(f,.62,.96);
  movingRNA.position.x=index===0?5.25*(1-THREE.MathUtils.smoothstep(p,.1,.85)):(1-index)*codonSpacing-(index<76?codonSpacing*translocation:0);
  activeCodonHalo.position.x=index*codonSpacing;activeCodonHalo.material.color.setHex(index===76?0xf1a38b:0xf6ce90);if(hoverRoot===activeCodonHalo)activeCodonHalo.material.color.lerp(new THREE.Color(0xfff1b7),.2);activeCodonHalo.userData.detail=codonDetail(index);
  if(index===0&&currentMeshes[0]){const starter=currentMeshes[0];starter.position.set(0,-.38,2.38);starter.scale.setScalar(p<.22?.001:Math.min(1,Math.max(.05,(p-.2)*2)));starter.userData.cargo.visible=p<.52;setPairing(starter,THREE.MathUtils.smoothstep(p,.65,.88));}
  if(index===76&&currentMeshes[0]){const holder=currentMeshes[0];holder.position.set(0,-.38,2.38);holder.scale.setScalar(1-THREE.MathUtils.smoothstep(p,76.46,76.8));setPairing(holder,1-THREE.MathUtils.smoothstep(p,76.46,76.72));}
  if(index>0&&index<76){const [prev,current,exiting]=currentMeshes;prev.position.set(siteX.P+(siteX.E-siteX.P)*translocation,-.38,2.38);current.position.set(4.8+(siteX.A-4.8)*THREE.MathUtils.smoothstep(f,.02,.26)+(siteX.P-siteX.A)*translocation,-.38,2.38);current.userData.cargo.visible=f<.55;prev.userData.cargo.visible=false;setPairing(prev,1-THREE.MathUtils.smoothstep(f,.62,.94));setPairing(current,THREE.MathUtils.smoothstep(f,.25,.42));if(exiting){exiting.position.set(siteX.E-1.4*THREE.MathUtils.smoothstep(f,.2,.9),-.38,2.38);exiting.scale.setScalar(1-THREE.MathUtils.smoothstep(f,.05,.95));setPairing(exiting,0);}}
  releaseFactorGroup.visible=p>=76.08&&p<76.8;
  if(releaseFactorGroup.visible){const approach=THREE.MathUtils.smoothstep(p,76.08,76.36);releaseFactorGroup.position.set(4.8+(siteX.A-4.8)*approach,-.38,2.45);releaseFactorGroup.scale.setScalar(THREE.MathUtils.smoothstep(p,76.08,76.18)*(1-THREE.MathUtils.smoothstep(p,76.67,76.8)));}
  // The last residue stays over the P-site carrier until peptide transfer to A.
  const transfer=index>0&&index<76?THREE.MathUtils.smoothstep(f,.44,.62):0;
  chainGroup.position.x=index>0&&index<76?codonSpacing*transfer*(1-translocation):0;
  const chainLength=p<.52?0:p<1?1:p<76?Math.min(76,index+(phase>.55?1:0)):76;
  const growth=index>0&&index<76?THREE.MathUtils.smoothstep(f,.55,.62):1;
  const effectiveCount=index>0&&index<76?index+growth:chainLength;
  for(let j=0;j<76;j++){
    const bead=chainBeads[j];bead.visible=j<chainLength;
    if(!bead.visible)continue;
    const start=chainPosition(j,effectiveCount),end=foldGroup.userData.ca[j];
    bead.position.copy(start).lerp(end,foldT);
    bead.scale.setScalar(j===index&&index>0&&index<76?Math.max(.01,growth):1);
    chainBond.geometry.attributes.position.setXYZ(j,bead.position.x,bead.position.y,bead.position.z);
  }
  chainBond.geometry.setDrawRange(0,chainLength);chainBond.geometry.attributes.position.needsUpdate=true;chainBond.userData.detail=p>=77?proteinDetail:chainDetail;
  const backboneFinish=THREE.MathUtils.smoothstep(foldT,.9,1);backboneTube.visible=foldT>.9;backboneTube.material.opacity=backboneFinish;chainBond.material.opacity=.9*(1-.55*backboneFinish);
  chainGroup.visible=active&&(p<77||state.structureMode==='backbone');
  foldGroup.visible=p>=77&&state.structureMode==='ribbon';foldMaterials.forEach(mat=>mat.opacity=1);
  ballStickGroup.visible=p>=77&&state.structureMode==='ballStick';spaceFillGroup.visible=p>=77&&state.structureMode==='spaceFill';
  if(hoverPick&&(!isWorldVisible(hoverPick.object)||!isDetailPresent(hoverPick.item)))clearModelHighlight();
  controls.update();renderer.render(scene,camera);
}
function formatCaption(p){if(p<.14)return 'A complete mRNA message carries the instructions, read three bases at a time.';if(p<.65)return 'The 5′ end of the mRNA enters the ribosome and slides toward the P site.';if(p<1)return 'AUG reaches P. The initiator tRNA pairs with the start codon.';if(p<3){const phase=p%1;if(phase<.26)return '1 · A charged tRNA enters the A site beside the chain-carrying tRNA in P.';if(phase<.44)return '2 · Its anticodon pairs with the codon in the A site.';if(phase<.62)return '3 · The chain transfers from the P-site tRNA to the A-site amino acid.';return '4 · The emptied tRNA moves toward E as the chain-bearing tRNA shifts A → P.';}if(p<76)return 'The same A → P → E cycle repeats rapidly while mRNA moves through the ribosome.';if(p<76.44)return 'UAA reaches A. A release factor enters instead of a tRNA.';if(p<76.7)return 'The release factor frees the completed chain from the P-site tRNA.';if(p<77)return 'The free chain leaves the ribosome and bends into its measured backbone shape.';return {backbone:'Cα backbone · 76 measured positions linked into one trace. The folding path is illustrative.',ribbon:'Ribbon · helices, sheets, and loops follow the measured 1UBQ backbone.',ballStick:'Ball & stick · 602 measured heavy atoms with inferred bonds; hydrogens are omitted.',spaceFill:'Space filling · heavy atoms are shown at approximate van der Waals radii.'}[state.structureMode];}
function chainCount(p){return p<.52?0:p<1?1:p<76?Math.min(76,Math.floor(p)+(p%1>=.62?1:0)):76;}
function pausedAction(p){if(p<1)return 'mRNA entry and start recognition';if(p<76){const phase=p%1;return phase<.26?'tRNA entering A':phase<.44?'codon–anticodon pairing':phase<.62?'peptide bond forming':'A → P → E translocation';}return p<76.45?'stop codon in A':p<77?'chain release and folding':'folded protein';}
function updatePauseReadout(){
  const p=state.progress;
  dom.pauseReadout.hidden=state.playing||p<.14;
  if(dom.pauseReadout.hidden)return;
  const index=Math.min(76,Math.floor(p)),stop=index===76;
  const rows=[['mRNA codon',codons[index]],['tRNA anticodon',stop?'none':anticodon(codons[index])],['Amino acid',stop?'none added':AA[sequence[index]].name],...(stop?[['Stop reader','release factor']]:[]),['Action',pausedAction(p)],['Chain length',`${chainCount(p)} / 76`]];
  dom.pauseReadout.innerHTML=`<span class="pause-eyebrow">PAUSED FRAME · CODON ${index+1} / 77</span>${rows.map(([name,value])=>`<div><span>${name}</span><strong>${value}</strong></div>`).join('')}`;
}
function updateAvailableObjects(){
  const available=visibleParts();
  const select=$('object-select');
  const key=Object.entries(available).filter(([,present])=>present).map(([name])=>name).join('|');
  if(key===updateAvailableObjects.lastKey)return;
  updateAvailableObjects.lastKey=key;
  const selected=select.value;
  select.replaceChildren(...objectOptions.filter(option=>!option.value||available[option.value]).map(option=>option.cloneNode(true)));
  select.value=available[selected]?selected:'';
}
function updateUI(){
  const p=state.progress,index=Math.min(76,Math.floor(p));
  const phase=p<.14?'THE MESSAGE':p<1?'INITIATION · mRNA ENTRY':p<2?'ELONGATION · CYCLE 1 SLOW':p<3?'ELONGATION · CYCLE 2 SLOW':p<76?'ELONGATION · RAPID REPEAT':p<76.44?'STOP CODON':p<77?'RELEASE AND FOLD':'FOLDED PROTEIN';
  dom.phase.textContent=phase;dom.progressPhase.textContent=phase;
  const rapid=state.playing&&p>=3&&p<76;
  dom.codon.textContent=p>=77?'1UBQ':p<.14?'5′→3′':rapid?'A→P→E':codons[index];
  const viewLabels={backbone:'Cα backbone',ribbon:'ribbon',ballStick:'ball & stick',spaceFill:'space filling'};
  dom.amino.textContent=p>=77?`Folded ubiquitin · ${viewLabels[state.structureMode]}`:p<.14?'A · U · G · C · 231 bases':rapid?'REPEATING CYCLE':index===76?'Stop signal':`${AA[sequence[index]].name} · ${AA[sequence[index]].abbr}`;
  dom.chain.innerHTML=`${chainCount(p)} <small>/ 76 residues</small>`;
  dom.caption.textContent=formatCaption(p);
  dom.timeline.value=String(state.playheadSeconds);dom.timeline.style.setProperty('--progress',`${state.playheadSeconds/totalSeconds*100}%`);
  dom.count.textContent=`${String(Math.min(77,Math.max(0,Math.ceil(p)))).padStart(2,'0')} / 77 CODONS`;
  dom.structureModes.hidden=p<77;
  if(index!==lastSelection){codonButtons.forEach((button,i)=>{button.classList.toggle('active',i===index);button.classList.toggle('played',i<index);button.setAttribute('aria-current',i===index?'step':'false');});const target=codonButtons[index];if(target){const trackBox=dom.track.getBoundingClientRect(),targetBox=target.getBoundingClientRect();const left=targetBox.left-trackBox.left+dom.track.scrollLeft-dom.track.clientWidth/2+targetBox.width/2;dom.track.scrollLeft=left;}lastSelection=index;}
  updateAvailableObjects();refreshInspector();updatePauseReadout();
}
function setProgress(value){if(value<77&&state.progress>=77){state.structureMode='backbone';dom.structureModes.querySelectorAll('button[data-mode]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice.dataset.mode==='backbone')));}state.progress=Math.max(0,Math.min(77,value));state.playheadSeconds=progressToSeconds(state.progress);updateUI();update3D();if(lastScenePointer)onPointerMove(lastScenePointer);syncPlay();}
function syncPlay(){dom.playIcon.textContent=state.playing?'Ⅱ':'▶';dom.playText.textContent=state.playing?'Pause sequence':state.progress>=77?'Replay sequence':'Play sequence';dom.play.setAttribute('aria-label',dom.playText.textContent);}
dom.play.addEventListener('click',()=>{if(state.progress>=77)setProgress(0);state.playing=!state.playing;syncPlay();updateUI();});
$('restart').addEventListener('click',()=>{state.playing=false;syncPlay();setProgress(0);state.pinned=null;refreshInspector();});
$('previous').addEventListener('click',()=>{state.playing=false;syncPlay();const current=Math.floor(state.progress);setProgress(current<=1?.5:current-1+.42);});
$('next').addEventListener('click',()=>{state.playing=false;syncPlay();const current=Math.floor(state.progress);setProgress(current>=76?77:current+1+.42);});
dom.timeline.addEventListener('input',()=>{state.playing=false;syncPlay();setProgress(secondsToProgress(Number(dom.timeline.value)));});
dom.speed.addEventListener('change',()=>{state.speed=Number(dom.speed.value);});
dom.unpin.addEventListener('click',()=>{state.pinned=null;refreshInspector();});
dom.structureModes.querySelectorAll('button[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  state.structureMode=button.dataset.mode;
  dom.structureModes.querySelectorAll('button[data-mode]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
  updateUI();update3D();if(lastScenePointer)onPointerMove(lastScenePointer);
}));
$('object-select').addEventListener('change',event=>{const choice=event.target.value,index=Math.min(76,Math.floor(state.progress));const items={mrna:mrnaDetail,ribosome:ribosomeDetail,E:siteDetail('E'),P:siteDetail('P'),A:siteDetail('A'),trna:index===76?trnaDetail(75):trnaDetail(index),releaseFactor:releaseFactorDetail,residue:index<76?aminoDetail(sequence[index],index):null,chain:chainDetail,protein:proteinDetail};if(visibleParts()[choice]&&items[choice])pin(items[choice]);event.target.value='';});
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'&&document.activeElement===document.body){e.preventDefault();dom.play.click();}if(e.code==='ArrowRight'&&document.activeElement===document.body)$('next').click();if(e.code==='ArrowLeft'&&document.activeElement===document.body)$('previous').click();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{state.reduceMotion=e.matches;});
init3D();updateUI();update3D();syncPlay();
let lastTime=performance.now();function frame(now){const dt=Math.min(.09,(now-lastTime)/1000);lastTime=now;if(state.playing){state.playheadSeconds=Math.min(totalSeconds,state.playheadSeconds+dt*state.speed);state.progress=secondsToProgress(state.playheadSeconds);if(state.progress>=77){state.progress=77;state.playing=false;syncPlay();}updateUI();}if(particles&&!state.reduceMotion){particles.rotation.z+=dt*.006;}update3D();if(lastScenePointer&&now-lastHoverSample>80)onPointerMove(lastScenePointer);if(aminoPreview){aminoPreview.controls.update();aminoPreview.renderer.render(aminoPreview.scene,aminoPreview.camera);}requestAnimationFrame(frame);}requestAnimationFrame(frame);

// A small public hook supports deterministic browser checks without exposing app internals.
window.translationLesson={sequence,codons,aminoAcids:AA,structureId:structure.pdb,setProgress,getProgress:()=>state.progress,getPlayheadSeconds:()=>state.playheadSeconds,getPinned:()=>state.pinned?.id||null,getRNAOffset:()=>movingRNA?.position.x,getHover:()=>hoverPick?.item.id||null,getHighlightState:()=>({item:hoverPick?.item.id||null,parts:hoverBackups.length}),getAvailableParts:()=>visibleParts(),getTRNAState:()=>({cached:trnaCache.size,active:currentMeshes.map(group=>({index:group.userData.index,x:group.position.x,scale:group.scale.x,pairing:group.userData.pairing.visible,cargo:group.userData.cargo.visible}))}),getStructureState:()=>({mode:state.structureMode,chainVisible:chainGroup?.visible,ribbonVisible:foldGroup?.visible,ballStickVisible:ballStickGroup?.visible,spaceFillVisible:spaceFillGroup?.visible,atomCount:ballStickGroup?.userData.atomCount,bondCount:ballStickGroup?.userData.bondCount}),getChainTip:()=>{const n=chainCount(state.progress);if(!n)return null;const bead=chainBeads[n-1];return {residue:n-1,x:bead.position.x+chainGroup.position.x,y:bead.position.y,z:bead.position.z,scale:bead.scale.x};},secondsToProgress,progressToSeconds,playbackSegments};
