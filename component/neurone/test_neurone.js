/*
    Tests unitaires pour neurone.js
    Lancer: npm run startNTest

    Prerequis: neurone.js doit exporter KnuthShuffle, sigmoid, neuron, learning, trainingNeuron.
    NEURONE_PATH permet de tester une autre version du fichier (ex: copie corrigee).
*/

import { genererDonnees, VRAIS_POIDS, VRAI_BIAIS } from "./donnees_neurone.js";

const N = await import(process.env.NEURONE_PATH || "./neurone.js");

// ---------- mini framework ----------
let passes = 0;
let fails = 0;
const failures = [];

function test(nom, fn) {
    try {
        fn();
        passes++;
        console.log(`  ok   ${nom}`);
    } catch (e) {
        fails++;
        failures.push(nom);
        console.log(`  FAIL ${nom}\n       ${e.message}`);
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || "assertion echouee");
}

function assertEq(a, b, msg) {
    if (a !== b) throw new Error(`${msg || "egalite"}: attendu ${b}, recu ${a}`);
}

function assertClose(a, b, eps = 1e-9, msg) {
    if (!(Math.abs(a - b) <= eps)) throw new Error(`${msg || "proche"}: attendu ${b}, recu ${a}`);
}

const copie = X => X.map(r => [...r]);

// erreur quadratique moyenne du neurone (w, b) sur des donnees
function mse(X, resp, w, b) {
    let s = 0;
    X.forEach((x, i) => { s += (resp[i] - N.neuron(x, w, b)) ** 2; });
    return s / X.length;
}

// ---------- donnees ----------
const { X, resp } = genererDonnees(500, 42);

console.log("\ndonnees");
test("jeu de donnees valide (500 exemples, entrees et sorties dans [0,1])", () => {
    assertEq(X.length, 500);
    assertEq(resp.length, 500);
    X.forEach(x => {
        assertEq(x.length, VRAIS_POIDS.length);
        x.forEach(v => assert(v >= 0 && v <= 1, `entree hors [0,1]: ${v}`));
    });
    resp.forEach(r => assert(r >= 0 && r <= 1, `sortie hors [0,1]: ${r}`));
});
test("donnees deterministes (meme graine = memes donnees)", () => {
    assertEq(JSON.stringify(genererDonnees(500, 42)), JSON.stringify({ X, resp }));
});
test("sorties variees (pas une constante)", () => {
    assert(Math.max(...resp) - Math.min(...resp) > 0.3, "sorties trop proches");
});

// ---------- fonctions de base ----------
console.log("\nfonctions de base");
test("sigmoid", () => {
    assertClose(N.sigmoid(0), 0.5);
    assertClose(N.sigmoid(2) + N.sigmoid(-2), 1);
    assert(N.sigmoid(10) > 0.9999 && N.sigmoid(-10) < 0.0001, "saturation");
    assert(Number.isFinite(N.sigmoid(1000)) && Number.isFinite(N.sigmoid(-1000)), "overflow");
});
test("KnuthShuffle(array1, array2) conserve les elements et garde les deux tableaux alignes", () => {
    const base = Array.from({ length: 200 }, (_, i) => i);
    const r = N.KnuthShuffle([...base], base.map(v => v * 10));
    assertEq(r.array1.length, base.length);
    assertEq(r.array2.length, base.length);
    assertEq(JSON.stringify([...r.array1].sort((a, b) => a - b)), JSON.stringify(base));
    r.array1.forEach((v, i) => assertEq(r.array2[i], v * 10, `desalignement a l'index ${i}`));
    assert(JSON.stringify(r.array1) !== JSON.stringify(base), "ordre inchange (probabilite infime)");
});

// ---------- neuron (prediction) ----------
console.log("\nneuron (prediction)");
test("sortie = sigmoid(somme ponderee + biais)", () => {
    const x = [0.5, 0.2, 0.9], w = [1, -2, 0.5], b = 0.3;
    assertClose(N.neuron(x, w, b), N.sigmoid(0.5 - 0.4 + 0.45 + 0.3));
});
test("entrees nulles : sortie = sigmoid(biais)", () => {
    assertClose(N.neuron([0, 0, 0], [5, 5, 5], 0), 0.5);
    assertClose(N.neuron([0, 0, 0], [5, 5, 5], 2), N.sigmoid(2));
});
test("sortie toujours dans (0, 1)", () => {
    X.forEach(x => {
        const r = N.neuron(x, [50, -50, 50, -50], 3);
        assert(r > 0 && r < 1 || r === 0 || r === 1, `hors plage ${r}`);
        assert(Number.isFinite(r), "non fini");
    });
});
test("monotone en fonction d'une entree a poids positif", () => {
    const w = [2, 0, 0, 0];
    assert(N.neuron([0.9, 0, 0, 0], w, 0) > N.neuron([0.1, 0, 0, 0], w, 0), "non croissante");
});

// ---------- learning (une correction) ----------
console.log("\nlearning (une correction)");
test("erreur positive : poids augmentent proportionnellement a l'entree, biais aussi", () => {
    const w = [0.5, 0.5, 0.5], x = [1, 0.5, 0];
    const r = N.learning(1, 0.5, x, [...w], 0.1, 0);
    assertClose(r.w[0], 0.5 + 0.1 * 1 * 0.5);
    assertClose(r.w[1], 0.5 + 0.1 * 0.5 * 0.5);
    assertClose(r.w[2], 0.5, 1e-12, "entree nulle = poids inchange");
    assertClose(r.b, 0 + 0.1 * 0.5);
});
test("erreur negative : poids et biais diminuent", () => {
    const r = N.learning(0, 0.8, [1, 1], [0.5, 0.5], 0.1, 0.2);
    assert(r.w[0] < 0.5 && r.w[1] < 0.5, "poids non diminues");
    assert(r.b < 0.2, "biais non diminue");
});
test("erreur nulle : rien ne change", () => {
    const r = N.learning(0.7, 0.7, [1, 0.3], [0.2, 0.4], 0.5, 0.1);
    assertClose(r.w[0], 0.2);
    assertClose(r.w[1], 0.4);
    assertClose(r.b, 0.1);
});
test("taux 0 : rien ne change et pas de NaN", () => {
    const r = N.learning(1, 0.2, [1, 1], [0.3, 0.3], 0, 0.1);
    assertClose(r.w[0], 0.3);
    assertClose(r.b, 0.1);
});
test("une correction rapproche la sortie de la reponse attendue", () => {
    const x = [0.9, 0.4, 0.7, 0.2];
    let w = [0.1, 0.1, 0.1, 0.1], b = 0;
    const cible = 0.95;
    const avant = Math.abs(cible - N.neuron(x, w, b));
    const r = N.learning(cible, N.neuron(x, w, b), x, w, 0.5, b);
    const apres = Math.abs(cible - N.neuron(x, r.w, r.b));
    assert(apres < avant, `avant ${avant.toFixed(4)} apres ${apres.toFixed(4)}`);
});

// ---------- trainingNeuron ----------
console.log("\ntrainingNeuron");
const w0 = [0, 0, 0, 0], b0 = 0;
let erreurAvant = NaN;
let res = {};
let erreur = NaN;
try {
    erreurAvant = mse(X, resp, w0, b0);
    res = N.trainingNeuron(copie(X), [...w0], b0, [...resp], 0.5, 100);
    erreur = mse(X, resp, res.w, res.b);
} catch (e) {
    console.log(`  (entrainement impossible: ${e.message})`);
}

test("trainingNeuron s'execute sans erreur et retourne { w, b }", () => {
    assert(Array.isArray(res.w) && typeof res.b === "number", "retour invalide (voir message ci-dessus)");
    assertEq(res.w.length, 4);
});
test("pas de NaN / Infinity dans les poids et le biais", () => {
    assert(res.w && res.w.every(Number.isFinite), "poids non finis");
    assert(Number.isFinite(res.b), `biais non fini: ${res.b}`);
});
test("l'erreur baisse fortement apres entrainement", () => {
    console.log(`       mse avant ${erreurAvant.toFixed(5)} | apres ${erreur.toFixed(5)}`);
    assert(erreur < erreurAvant / 5, "erreur pas assez reduite");
});
test("erreur finale faible (< 0.001) sur donnees sans bruit", () => {
    assert(erreur < 0.001, `mse ${erreur}`);
});
test("les poids appris ont le signe des vrais poids", () => {
    VRAIS_POIDS.forEach((p, i) => assert(Math.sign(res.w[i]) === Math.sign(p), `poids ${i}: ${res.w[i]} vs ${p}`));
    assert(res.b < 0, `biais ${res.b} devrait etre negatif (vrai ${VRAI_BIAIS})`);
});
test("les etiquettes restent alignees avec les entrees malgre le melange", () => {
    // si le melange desaligne X et resp, le neurone ne peut pas converger: on compare avec l'ordre d'origine
    const bruite = genererDonnees(300, 7, 0);
    const r = N.trainingNeuron(copie(bruite.X), [0, 0, 0, 0], 0, [...bruite.resp], 0.5, 50);
    assert(mse(bruite.X, bruite.resp, r.w, r.b) < 0.005, "etiquettes desalignees ?");
});
test("0 epoque : poids et biais inchanges", () => {
    const r = N.trainingNeuron(copie(X), [0.1, 0.2, 0.3, 0.4], 0.5, [...resp], 0.5, 0);
    assertEq(JSON.stringify(r.w), "[0.1,0.2,0.3,0.4]");
    assertEq(r.b, 0.5);
});
test("tolere un jeu bruite (erreur < 0.01 avec bruit 0.1)", () => {
    const d = genererDonnees(500, 3, 0.1);
    const r = N.trainingNeuron(copie(d.X), [0, 0, 0, 0], 0, [...d.resp], 0.5, 100);
    const e = mse(d.X, d.resp, r.w, r.b);
    console.log(`       mse bruit 0.1 : ${e.toFixed(5)}`);
    assert(e < 0.01, `mse ${e}`);
});

// ---------- bilan ----------
console.log(`\n${passes} reussis, ${fails} echoues`);
if (fails) {
    console.log("Echecs:\n - " + failures.join("\n - "));
    process.exit(1);
}
