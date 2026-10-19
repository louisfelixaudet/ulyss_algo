/*
    Exploration de la semantique des mots appris par word2vecter

    Usage:
      npm run exploreWV                      -> voisins d'une selection de mots
      npm run exploreWV -- chat sport code   -> voisins des mots donnes
      npm run exploreWV -- --sim chat chien  -> similarite entre deux mots
      npm run exploreWV -- --ana roi homme femme  -> analogie: roi - homme + femme
    Options: --k=8 (nb de voisins)  --epoques=30  --dim=30
*/

import * as W from "./word2vecter.js";
import { genererLexique } from "./lexique_test.js";

const args = process.argv.slice(2);
const opt = (nom, defaut) => {
    const a = args.find(x => x.startsWith(`--${nom}=`));
    return a ? Number(a.split("=")[1]) : defaut;
};
const K = opt("k", 8);
const EPOQUES = opt("epoques", 30);
const DIM = opt("dim", 30);
const mots = args.filter(a => !a.startsWith("--") || ["--sim", "--ana"].includes(a));

const cosinus = (a, b) => W.dot(a, b) / (Math.sqrt(W.dot(a, a)) * Math.sqrt(W.dot(b, b)) || 1);

// ---- entrainement ----
const lexique = genererLexique();
const { mots: dict, index } = W.makeDict(lexique);
const paires = W.createPaires(lexique, index, 2);
const [W1, W2] = W.createTab(dict, DIM);
console.log(`Entrainement: ${dict.length} mots, ${paires.length} paires, ${EPOQUES} epoques, dim ${DIM}...`);
const { W1: vecs } = W.training(W1, W2, paires, 5, EPOQUES, 0.05);

function vecteur(mot) {
    if (!index.has(mot)) {
        console.log(`  mot inconnu du dictionnaire: "${mot}"`);
        return null;
    }
    return vecs[index.get(mot)];
}

function voisins(v, exclure = [], k = K) {
    return dict
        .map((m, i) => ({ mot: m, score: cosinus(v, vecs[i]) }))
        .filter(x => !exclure.includes(x.mot))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}

function afficher(titre, liste) {
    console.log(`\n${titre}`);
    liste.forEach(x => console.log(`  ${x.score.toFixed(3).padStart(6)}  ${x.mot}`));
}

// ---- modes ----
if (args[0] === "--sim") {
    const [a, b] = [vecteur(args[1]), vecteur(args[2])];
    if (a && b) console.log(`\nsimilarite cosinus(${args[1]}, ${args[2]}) = ${cosinus(a, b).toFixed(3)}`);
} else if (args[0] === "--ana") {
    const [x, y, z] = args.slice(1, 4);
    const [vx, vy, vz] = [vecteur(x), vecteur(y), vecteur(z)];
    if (vx && vy && vz) {
        const cible = vx.map((n, i) => n - vy[i] + vz[i]);
        afficher(`${x} - ${y} + ${z} =`, voisins(cible, [x, y, z]));
    }
} else {
    const requetes = mots.length ? mots : ["chat", "chien", "joueur", "code", "soupe", "montagne", "professeur", "train"];
    requetes.forEach(m => {
        const v = vecteur(m);
        if (v) afficher(`voisins de "${m}"`, voisins(v, [m]));
    });
}
