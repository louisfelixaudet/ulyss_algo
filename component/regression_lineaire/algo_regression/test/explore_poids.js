/*
    Tester des predictions avec les poids entraines (poids_entraines.json)
    Lancer d'abord: npm run verifRL

    Usage:
      npm run exploreRL                         -> mode interactif
      npm run exploreRL -- --x=0.2,0.5,0.9      -> une seule prediction

    En mode interactif:
      0.2 0.5 0.9     prediction pour ces x (separes par espaces ou virgules)
      poids           affiche les poids
      q               quitter
*/

import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import * as R from "../regression_lineaire_algo.js";

const fichier = new URL("./poids_entraines.json", import.meta.url);
if (!existsSync(fichier)) {
    console.log("poids_entraines.json introuvable: lancer d'abord npm run verifRL");
    process.exit(1);
}
const poids = JSON.parse(readFileSync(fichier, "utf8"));
const { a, b, vrai } = poids;

const f = v => Number(v).toFixed(4);

function afficherPoids() {
    console.log(`Poids entraines: a = [${a.map(f).join(", ")}]  b = ${f(b)}`);
    if (vrai) console.log(`Vrais poids:     a = [${vrai.a.map(f).join(", ")}]  b = ${f(vrai.b)}`);
    const e = poids.entrainement;
    if (e) console.log(`Entrainement: ${e.epoques} epoques, lr ${e.lr}, bruit ${e.bruit}, ${e.n} exemples, mse finale ${f(e.mse)}`);
}

// retourne un message d'erreur, ou null si x est valide
function verifierX(x) {
    if (x.length !== a.length) return `il faut ${a.length} valeurs, recu ${x.length}`;
    if (!x.every(Number.isFinite)) return "valeur non numerique";
    return null;
}

function prediction(x) {
    const probleme = verifierX(x);
    if (probleme) {
        console.log(`  erreur: ${probleme}`);
        return;
    }
    const y = R.predict(a, x, b);
    // detail de la contribution de chaque variable
    x.forEach((xi, i) => console.log(`  x${i + 1} = ${f(xi)}  * a${i + 1} ${f(a[i])}  = ${f(xi * a[i])}`));
    console.log(`  + b = ${f(b)}`);
    console.log(`  => prediction = ${f(y)}`);
    if (vrai) {
        const attendu = R.predict(vrai.a, x, vrai.b);
        console.log(`     valeur attendue (vrais poids, sans bruit) = ${f(attendu)}  ecart ${f(Math.abs(y - attendu))}`);
    }
    if (x.some(v => v < 0 || v > 1)) console.log("     attention: hors de [0, 1], le modele n'a pas vu ces valeurs a l'entrainement");
}

const lire = ligne => ligne.split(/[\s,;]+/).filter(Boolean).map(Number);

afficherPoids();

const argX = process.argv.slice(2).find(x => x.startsWith("--x="));
if (argX) {
    console.log();
    prediction(lire(argX.slice(4)));
    process.exit(0);
}

console.log(`\nEntrer ${a.length} valeurs de x (ex: 0.2 0.5 0.9), "poids" ou "q" pour quitter`);
const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: "x> " });
rl.prompt();
rl.on("line", ligne => {
    const texte = ligne.trim().toLowerCase();
    if (texte === "q" || texte === "quit") return rl.close();
    if (texte === "poids") afficherPoids();
    else if (texte) prediction(lire(texte));
    rl.prompt();
});
