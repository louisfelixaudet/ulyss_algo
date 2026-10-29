/*
    Verification des poids de la regression lineaire

    1. genere des donnees avec des poids connus (les "vrais" poids)
    2. verifie chaque fonction de l'algo a la console sur la 1re epoque
    3. entraine le modele et compare les poids appris aux vrais poids
    4. sauvegarde les poids dans poids_entraines.json (utilises par explore_poids.js)

    Usage:
      npm run verifRL
      npm run verifRL -- --epoques=3000 --lr=0.5 --bruit=0.05 --n=200
*/

import { writeFileSync } from "node:fs";
import * as R from "../regression_lineaire_algo.js";

const args = process.argv.slice(2);
const opt = (nom, defaut) => {
    const a = args.find(x => x.startsWith(`--${nom}=`));
    return a ? Number(a.split("=")[1]) : defaut;
};
const EPOQUES = opt("epoques", 3000);
const LR = opt("lr", 0.5);
const BRUIT = opt("bruit", 0.05);
const NB = opt("n", 200);
const TOLERANCE = 0.1;

// vrais poids: y = 2.5 * x1 - 1.2 * x2 + 0.8 * x3 + 0.5
const VRAI_A = [2.5, -1.2, 0.8];
const VRAI_B = 0.5;

// generateur aleatoire avec graine (memes donnees a chaque lancement)
function random(seed) {
    return () => {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rand = random(42);
const x = Array.from({ length: NB }, () => VRAI_A.map(() => rand()));
const y = x.map(xi => R.predict(VRAI_A, xi, VRAI_B) + (rand() * 2 - 1) * BRUIT);

let fails = 0;
function check(nom, cond, detail = "") {
    console.log(`  ${cond ? "ok  " : "FAIL"} ${nom}${detail ? "  (" + detail + ")" : ""}`);
    if (!cond) fails++;
}

const f = v => Number(v).toFixed(4);

console.log(`Donnees: ${NB} exemples, 3 variables, bruit ${BRUIT}`);
console.log(`Vrais poids: a = [${VRAI_A.join(", ")}]  b = ${VRAI_B}`);
console.log(`Exemple: x = [${x[0].map(f).join(", ")}]  y = ${f(y[0])}`);

// ---------- 1re epoque, fonction par fonction ----------
console.log("\n=== verification des fonctions (1re epoque, poids a 0) ===");
const a0 = [0, 0, 0];
const b0 = 0;

console.log("\npredict");
const yP = x.map(xi => R.predict(a0, xi, b0));
check("poids a 0 -> toutes les predictions valent b", yP.every(v => v === b0));
const pVrai = R.predict(VRAI_A, x[0], VRAI_B);
const pMain = VRAI_A[0] * x[0][0] + VRAI_A[1] * x[0][1] + VRAI_A[2] * x[0][2] + VRAI_B;
check("predict(vrais poids) = calcul a la main", Math.abs(pVrai - pMain) < 1e-12, `${f(pVrai)} = ${f(pMain)}`);

console.log("\nerreurs");
const err = R.erreurs(y, yP);
check("une erreur par exemple", err.length === NB, `${err.length}`);
check("erreur[0] = y[0] - prediction[0]", err[0] === y[0] - yP[0], f(err[0]));

console.log("\nMSE");
const mse0 = R.MSE(y, yP);
const mseVrai = R.MSE(y, x.map(xi => R.predict(VRAI_A, xi, VRAI_B)));
check("MSE de depart finie et > 0", Number.isFinite(mse0) && mse0 > 0, f(mse0));
check("MSE des vrais poids <= bruit^2 / 2", mseVrai <= BRUIT ** 2 / 2 + 1e-12, f(mseVrai));

console.log("\ngradiant");
const g = R.gradiant(err, x, a0.length);
console.log(`  gradient a = [${g.a.map(f).join(", ")}]  b = ${f(g.b)}`);
// derivee numerique de la MSE pour chaque poids
const h = 1e-6;
const cout = (a, b) => R.MSE(y, x.map(xi => R.predict(a, xi, b)));
g.a.forEach((gi, i) => {
    const aP = [...a0]; aP[i] += h;
    const aM = [...a0]; aM[i] -= h;
    const num = (cout(aP, b0) - cout(aM, b0)) / (2 * h);
    check(`gradient a${i + 1} = derivee numerique`, Math.abs(gi - num) < 1e-5, `${f(gi)} vs ${f(num)}`);
});
const numB = (cout(a0, b0 + h) - cout(a0, b0 - h)) / (2 * h);
check("gradient b = derivee numerique", Math.abs(g.b - numB) < 1e-5, `${f(g.b)} vs ${f(numB)}`);

console.log("\nupdate");
const u = R.update(a0, b0, g.a, g.b, LR);
const mse1 = cout(u.a, u.b);
console.log(`  nouveaux poids a = [${u.a.map(f).join(", ")}]  b = ${f(u.b)}`);
check("un pas de gradient fait baisser la MSE", mse1 < mse0, `${f(mse0)} -> ${f(mse1)}`);
check("poids d'entree non modifies", a0.every(v => v === 0));

// ---------- entrainement complet ----------
console.log(`\n=== entrainement: ${EPOQUES} epoques, lr ${LR} ===`);
const debut = Date.now();
const r = R.training(a0, x, b0, y, LR, EPOQUES);
console.log(`  duree: ${Date.now() - debut} ms`);

// courbe de la MSE aux epoques 1, 2, 5, 10, 20, 50, ... et la derniere
console.log("\n  epoque   mse");
const max = r.mse[0];
const montrer = new Set([r.mse.length]);
for (let p = 1; p <= r.mse.length; p *= 10) [1, 2, 5].forEach(m => montrer.add(p * m));
r.mse.forEach((v, i) => {
    if (montrer.has(i + 1)) {
        const barre = Number.isFinite(v) ? "#".repeat(Math.round(Math.min(v / max, 1) * 40)) : "NaN";
        console.log(`  ${String(i + 1).padStart(6)}   ${v.toFixed(6)}   ${barre}`);
    }
});

console.log("\n  poids    vrai      appris    ecart");
const lignes = [...VRAI_A.map((v, i) => [`a${i + 1}`, v, r.a[i]]), ["b", VRAI_B, r.b]];
lignes.forEach(([nom, vrai, appris]) => {
    console.log(`  ${nom.padEnd(6)} ${f(vrai).padStart(8)}  ${f(appris).padStart(8)}  ${f(Math.abs(vrai - appris)).padStart(8)}`);
});

console.log("\n=== verification des poids ===");
const mseFin = r.mse[r.mse.length - 1];
check("toutes les MSE sont finies (lr pas trop grand)", r.mse.every(Number.isFinite));
check("la MSE a baisse", mseFin < r.mse[0], `${f(r.mse[0])} -> ${f(mseFin)}`);
check("la MSE ne remonte jamais", r.mse.every((v, i) => !i || v <= r.mse[i - 1] + 1e-12));
lignes.forEach(([nom, vrai, appris]) => {
    check(`${nom} proche du vrai poids (+/- ${TOLERANCE})`, Math.abs(vrai - appris) <= TOLERANCE);
});

// ---------- sauvegarde ----------
const fichier = new URL("./poids_entraines.json", import.meta.url);
writeFileSync(fichier, JSON.stringify({
    a: r.a,
    b: r.b,
    vrai: { a: VRAI_A, b: VRAI_B },
    entrainement: { epoques: EPOQUES, lr: LR, bruit: BRUIT, n: NB, mse: mseFin },
    date: new Date().toISOString()
}, null, 2));
console.log("\nPoids sauvegardes dans poids_entraines.json (npm run exploreRL pour les tester)");

console.log(`\n${fails ? fails + " verification(s) echouee(s)" : "tout est ok"}`);
if (fails) process.exit(1);
