/*
    Exploration de l'entrainement du neurone: erreur moyenne (MSE) a chaque epoque

    Usage:
      npm run exploreN
      npm run exploreN -- --epoques=50 --a=0.5 --bruit=0.1 --n=500
    NEURONE_PATH permet de tester une autre version de neurone.js.
*/

import { genererDonnees } from "./donnees_neurone.js";

const N = await import(/*process.env.NEURONE_PATH ||*/ "./neurone.js");

const args = process.argv.slice(2);
const opt = (nom, defaut) => {
    const a = args.find(x => x.startsWith(`--${nom}=`));
    return a ? Number(a.split("=")[1]) : defaut;
};
const EPOQUES = opt("epoques", 30);
const TAUX = opt("a", 0.5);
const BRUIT = opt("bruit", 0);
const NB = opt("n", 500);

const { X, resp } = genererDonnees(NB, 42, BRUIT);

function mse(w, b) {
    let s = 0;
    X.forEach((x, i) => { s += (resp[i] - N.neuron(x, w, b)) ** 2; });
    return s / X.length;
}

console.log(`Entrainement: ${NB} exemples, taux ${TAUX}, bruit ${BRUIT}, ${EPOQUES} epoques\n`);
console.log("epoque   mse        courbe");

let w = X[0].map(() => 0);
let b = 0;
const erreurs = [mse(w, b)];
for (let e = 1; e <= EPOQUES; e++) {
    ({ w, b } = N.trainingNeuron(X.map(r => [...r]), w, b, [...resp], TAUX, 1));
    erreurs.push(mse(w, b));
}

const max = Math.max(...erreurs);
erreurs.forEach((err, e) => {
    const barre = Number.isFinite(err) ? "#".repeat(Math.round((err / max) * 40)) : "NaN";
    console.log(`${String(e).padStart(5)}   ${err.toFixed(6)}   ${barre}`);
});
