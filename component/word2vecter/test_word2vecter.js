/*
    Tests unitaires pour word2vecter.js
    Lancer: npm run startWVTest

*/

import * as W from "./word2vecter.js";
import { genererLexique } from "./lexique_test.js";

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
    if (Math.abs(a - b) > eps) throw new Error(`${msg || "proche"}: attendu ${b}, recu ${a}`);
}

function toutFini(matrice) {
    return matrice.every(v => v.every(x => Number.isFinite(x)));
}

function cosinus(a, b) {
    return W.dot(a, b) / (Math.sqrt(W.dot(a, a)) * Math.sqrt(W.dot(b, b)));
}

// ---------- donnees ----------
const lexique = genererLexique();

// ---------- lexique ----------
console.log("\nlexique");
test("lexique large (>= 400 phrases, format valide)", () => {
    assert(lexique.length >= 400, `seulement ${lexique.length} phrases`);
    lexique.forEach(p => {
        assert(typeof p === "string" && p.trim() === p && !p.includes("  "), `phrase mal formee: "${p}"`);
        assert(p === p.toLowerCase(), `majuscule dans "${p}"`);
        assert(!/[.,;:!?'"]/.test(p), `ponctuation dans "${p}"`);
    });
});
test("lexique deterministe (meme graine = memes phrases)", () => {
    assertEq(JSON.stringify(genererLexique()), JSON.stringify(lexique));
});

// ---------- utilitaires ----------
console.log("\nutilitaires");
test("getRandomInt reste dans [min, max)", () => {
    for (let i = 0; i < 2000; i++) {
        const r = W.getRandomInt(-3, 7);
        assert(r >= -3 && r < 7, `hors bornes: ${r}`);
    }
});
test("dot", () => {
    assertEq(W.dot([1, 2, 3], [4, 5, 6]), 32);
    assertEq(W.dot([0, 0], [5, 9]), 0);
    assertEq(W.dot([], []), 0);
});
test("scale ne modifie pas l'original", () => {
    const a = [1, -2, 3];
    const b = W.scale(a, 2);
    assertEq(JSON.stringify(b), "[2,-4,6]");
    assertEq(JSON.stringify(a), "[1,-2,3]");
});
test("add ne modifie pas les originaux", () => {
    const a = [1, 2], b = [10, 20];
    assertEq(JSON.stringify(W.add(a, b)), "[11,22]");
    assertEq(JSON.stringify(a), "[1,2]");
    assertEq(JSON.stringify(b), "[10,20]");
});
test("sigmoid", () => {
    assertClose(W.sigmoid(0), 0.5);
    assert(W.sigmoid(10) > 0.9999 && W.sigmoid(-10) < 0.0001, "saturation");
    assertClose(W.sigmoid(2) + W.sigmoid(-2), 1);
    assert(Number.isFinite(W.sigmoid(1000)) && Number.isFinite(W.sigmoid(-1000)), "overflow");
});
test("KnuthShuffle conserve les elements", () => {
    const base = Array.from({ length: 200 }, (_, i) => i);
    const m = W.KnuthShuffle([...base]);
    assertEq(m.length, base.length);
    assertEq(JSON.stringify([...m].sort((a, b) => a - b)), JSON.stringify(base));
    assert(JSON.stringify(m) !== JSON.stringify(base), "ordre inchange (probabilite infime)");
});

// ---------- makeDict ----------
console.log("\nmakeDict");
test("garde seulement les mots vus plus de 3 fois (>= 4)", () => {
    const { mots } = W.makeDict(["a a a a b b b c"]);
    assertEq(JSON.stringify(mots), '["a"]');
    const r = W.makeDict(["a a a b"]);
    assertEq(r.mots.length, 0, "3 occurrences ne suffisent pas");
});
test("compte a travers plusieurs textes", () => {
    const { mots } = W.makeDict(["x y", "x y", "x", "x y y"]);
    assert(mots.includes("x") && mots.includes("y"), "x (5) et y (4) attendus");
});
test("index coherent avec mots, sans doublon", () => {
    const { mots, index } = W.makeDict(lexique);
    assert(mots.length > 50, `dictionnaire trop petit: ${mots.length}`);
    assertEq(new Set(mots).size, mots.length, "doublons dans mots");
    assertEq(index.size, mots.length);
    mots.forEach((m, i) => assertEq(index.get(m), i, `index de "${m}"`));
});
test("dictionnaire vide si aucun mot frequent", () => {
    const { mots, index } = W.makeDict(["un deux trois"]);
    assertEq(mots.length, 0);
    assertEq(index.size, 0);
});

// ---------- createPaires ----------
console.log("\ncreatePaires");
test("fenetre 2 : paires attendues sur une phrase courte", () => {
    const index = new Map([["a", 0], ["b", 1], ["c", 2]]);
    const paires = W.createPaires(["a b c"], index, 1);
    const attendu = [[0, 1], [1, 0], [1, 2], [2, 1]];
    assertEq(JSON.stringify(paires), JSON.stringify(attendu));
});
test("ignore les mots hors dictionnaire (ils ne creent pas de trou)", () => {
    const index = new Map([["a", 0], ["c", 1]]);
    const paires = W.createPaires(["a zzz c"], index, 1);
    assertEq(JSON.stringify(paires), JSON.stringify([[0, 1], [1, 0]]));
});
test("jamais de paire (i, i) d'une meme position et indices valides", () => {
    const { index, mots } = W.makeDict(lexique);
    const paires = W.createPaires(lexique, index, 2);
    assert(paires.length > 1000, `trop peu de paires: ${paires.length}`);
    paires.forEach(([c, v]) => {
        assert(Number.isInteger(c) && c >= 0 && c < mots.length, `centre invalide ${c}`);
        assert(Number.isInteger(v) && v >= 0 && v < mots.length, `voisin invalide ${v}`);
    });
});
test("symetrie: nombre de paires (a,b) = nombre de paires (b,a)", () => {
    const { index } = W.makeDict(lexique);
    const compte = new Map();
    W.createPaires(lexique, index, 2).forEach(([c, v]) => {
        const k = `${c}>${v}`;
        compte.set(k, (compte.get(k) || 0) + 1);
    });
    compte.forEach((n, k) => {
        const [c, v] = k.split(">");
        assertEq(compte.get(`${v}>${c}`), n, `asymetrie ${k}`);
    });
});
test("plus la fenetre est grande, plus il y a de paires", () => {
    const { index } = W.makeDict(lexique);
    const p1 = W.createPaires(lexique, index, 1).length;
    const p3 = W.createPaires(lexique, index, 3).length;
    assert(p3 > p1, `${p3} <= ${p1}`);
});

// ---------- createTab ----------
console.log("\ncreateTab");
test("dimensions W1 et W2", () => {
    const { W1, W2 } = W.createTab(["a", "b", "c"], 10);
    assertEq(W1.length, 3);
    assertEq(W2.length, 3);
    W1.concat(W2).forEach(v => assertEq(v.length, 10));
});
test("W1 initialise dans [-0.5/D, 0.5/D], W2 a zero", () => {
    const D = 20;
    const { W1, W2 } = W.createTab(new Array(50).fill("x"), D);
    W1.forEach(v => v.forEach(x => assert(Math.abs(x) <= 0.5 / D, `hors bornes ${x}`)));
    W2.forEach(v => v.forEach(x => assertEq(x, 0)));
    assert(W1.some(v => v.some(x => x !== 0)), "W1 tout a zero");
});
test("dimension par defaut 75", () => {
    const { W1 } = W.createTab(["a"]);
    assertEq(W1[0].length, 75);
});
test("lignes independantes (pas de reference partagee)", () => {
    const { W1, W2 } = W.createTab(["a", "b"], 4);
    W2[0][0] = 99;
    assertEq(W2[1][0], 0);
    assert(W1[0] !== W1[1]);
});

// ---------- getNegatif ----------
console.log("\ngetNegatif");
test("k negatifs valides, hors centre et hors voisins", () => {
    const voisins = new Set([1, 2, 3]);
    for (let essai = 0; essai < 200; essai++) {
        const neg = W.getNegatif(0, voisins, 50, 5);
        assertEq(neg.length, 5);
        neg.forEach(n => {
            assert(Number.isInteger(n) && n >= 0 && n < 50, `hors plage ${n}`);
            assert(n !== 0 && !voisins.has(n), `negatif interdit ${n}`);
        });
    }
});

// ---------- step ----------
console.log("\nstep");
test("un pas rapproche le centre du vrai voisin (score augmente)", () => {
    const wordv = [0.1, 0.2, -0.1, 0.05];
    const voisin = [0.3, -0.1, 0.2, 0.1];
    const avant = W.dot(wordv, voisin);
    const r = W.step(wordv, voisin, [], 0.5);
    assert(W.dot(r.v, r.u) > avant, "score non augmente");
});
test("un pas eloigne le centre des negatifs (score diminue)", () => {
    const wordv = [0.5, 0.5, 0.5, 0.5];
    const neg = [[0.4, 0.4, 0.4, 0.4], [0.2, 0.3, 0.1, 0.5]];
    const avant = neg.map(n => W.dot(wordv, n));
    const r = W.step(wordv, [0, 0, 0, 0], neg.map(n => [...n]), 0.5);
    r.n.forEach((n, i) => assert(W.dot(wordv, n) < avant[i], `negatif ${i} non eloigne`));
});
test("dimensions conservees et pas de NaN", () => {
    const r = W.step([0.1, 0.2, 0.3], [0.1, 0.1, 0.1], [[0.2, 0.2, 0.2], [0.3, 0.1, 0.0]], 0.05);
    assertEq(r.v.length, 3);
    assertEq(r.u.length, 3);
    assertEq(r.n.length, 2);
    assert(toutFini([r.v, r.u, ...r.n]), "valeur non finie");
});
test("taux 0 : aucun changement", () => {
    const r = W.step([0.1, 0.2], [0.3, 0.4], [[0.5, 0.6]], 0);
    assertEq(JSON.stringify(r.v), "[0.1,0.2]");
    assertEq(JSON.stringify(r.u), "[0.3,0.4]");
    assertEq(JSON.stringify(r.n), "[[0.5,0.6]]");
});

// ---------- training ----------
console.log("\ntraining");
const { mots, index } = W.makeDict(lexique);
const paires = W.createPaires(lexique, index, 2);
const D = 30;
const { W1, W2 } = W.createTab(mots, D);
const W1Initial = W1.map(v => [...v]);

// score moyen sigmoid(W1[c] . W2[v]) sur les vraies paires
function scoreMoyen(W1, W2) {
    let s = 0;
    paires.forEach(([c, v]) => { s += W.sigmoid(W.dot(W1[c], W2[v])); });
    return s / paires.length;
}
const scoreAvant = scoreMoyen(W1, W2);

let t0 = Date.now();
const res = W.training(W1, W2, paires, 5, 5, 0.05);
const duree = Date.now() - t0;
console.log(`  (${mots.length} mots, ${paires.length} paires, 5 epoques en ${duree} ms)`);

test("training retourne W1 et W2 de bonnes dimensions", () => {
    assertEq(res.W1.length, mots.length);
    assertEq(res.W2.length, mots.length);
    res.W1.concat(res.W2).forEach(v => assertEq(v.length, D));
});
test("aucune valeur NaN / Infinity apres entrainement", () => {
    assert(toutFini(res.W1), "NaN dans W1");
    assert(toutFini(res.W2), "NaN dans W2");
});
test("les poids ont change", () => {
    const change = res.W1.some((v, i) => v.some((x, j) => x !== W1Initial[i][j]));
    assert(change, "W1 identique");
    assert(res.W2.some(v => v.some(x => x !== 0)), "W2 toujours a zero");
});
test("le score des vraies paires augmente", () => {
    const apres = scoreMoyen(res.W1, res.W2);
    assert(apres > scoreAvant, `avant ${scoreAvant.toFixed(4)} apres ${apres.toFixed(4)}`);
});

// ---------- qualite (leger) : temoin que l'entrainement apprend quelque chose ----------
console.log("\nsemantique (indicatif)");
test("mots d'un meme theme plus proches en moyenne que mots de themes differents", () => {
    // entrainement un peu plus long pour stabiliser
    const { W1: A1, W2: A2 } = W.createTab(mots, D);
    const r = W.training(A1, A2, paires, 5, 30, 0.05);
    const themes = {
        sport: ["joueur", "equipe", "match", "terrain", "stade", "gardien", "coureuse"],
        technologie: ["programmeur", "code", "serveur", "logiciel", "algorithme", "ingenieur", "modele"]
    };
    const presents = n => themes[n].filter(m => index.has(m)).map(m => r.W1[index.get(m)]);
    const sport = presents("sport"), tech = presents("technologie");
    assert(sport.length >= 3 && tech.length >= 3, "pas assez de mots dans le dictionnaire");

    const moyenne = (A, B, memeEnsemble) => {
        let s = 0, n = 0;
        A.forEach((a, i) => B.forEach((b, j) => {
            if (memeEnsemble && i === j) return;
            s += cosinus(a, b); n++;
        }));
        return s / n;
    };
    const intra = (moyenne(sport, sport, true) + moyenne(tech, tech, true)) / 2;
    const inter = moyenne(sport, tech, false);
    console.log(`       cosinus intra-theme ${intra.toFixed(3)} | inter-theme ${inter.toFixed(3)}`);
    assert(intra > inter, "aucune structure semantique apprise");
});

// ---------- bilan ----------
console.log(`\n${passes} reussis, ${fails} echoues`);
if (fails) {
    console.log("Echecs:\n - " + failures.join("\n - "));
    process.exit(1);
}
