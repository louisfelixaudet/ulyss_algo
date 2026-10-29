/*
    Tests limites et standards pour regression_lineaire_algo.js
    Lancer: npm run startRLTest

    Pour chaque fonction: valeurs normales, extremes et impossibles.
*/

import * as R from "../regression_lineaire_algo.js";

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
    if (a !== b) throw new Error(`${msg || "egalite"}: attendu ${JSON.stringify(b)}, recu ${JSON.stringify(a)}`);
}

function assertJson(a, b, msg) {
    assertEq(JSON.stringify(a), JSON.stringify(b), msg);
}

function assertClose(a, b, eps = 1e-9, msg) {
    if (!(Math.abs(a - b) <= eps)) throw new Error(`${msg || "proche"}: attendu ${b}, recu ${a}`);
}

// verifie qu'une fonction leve une erreur (valeur impossible rejetee)
function assertThrows(fn, msg) {
    try {
        fn();
    } catch (e) {
        return;
    }
    throw new Error(msg || "une erreur etait attendue");
}

// ---------- predict ----------
console.log("\npredict");
test("normal: somme ponderee + biais", () => {
    assertEq(R.predict([2, 3], [1, 1], 1), 6);
});
test("normal: 3 x (cas d'usage)", () => {
    assertClose(R.predict([0.5, -1, 2], [4, 2, 1], 0.25), 2.25);
});
test("normal: poids nuls -> biais", () => {
    assertEq(R.predict([0, 0, 0], [7, 8, 9], 4), 4);
});
test("normal: valeurs negatives", () => {
    assertEq(R.predict([-1, -2], [3, -4], -1), 4);
});
test("extreme: x vide -> biais", () => {
    assertEq(R.predict([], [], 3), 3);
});
test("extreme: 1000 variables", () => {
    const n = 1000;
    assertEq(R.predict(new Array(n).fill(1), new Array(n).fill(2), 0), 2000);
});
test("extreme: valeurs enormes restent finies", () => {
    assert(Number.isFinite(R.predict([1e150], [1e150], 0)));
});
test("impossible: a plus court que x -> NaN (pas un faux nombre)", () => {
    assert(Number.isNaN(R.predict([1], [1, 2], 0)));
});
test("impossible: x null leve une erreur", () => {
    assertThrows(() => R.predict([1], null, 0));
});
test("impossible: a null leve une erreur", () => {
    assertThrows(() => R.predict(null, [1], 0));
});

// ---------- MSE ----------
console.log("\nMSE");
test("normal: predictions parfaites -> 0", () => {
    assertEq(R.MSE([1, 2, 3], [1, 2, 3]), 0);
});
test("normal: valeur connue 1/(2m) * somme des carres", () => {
    // ecarts 1, 0, 2 -> 1 + 0 + 4 = 5 -> 5 / 6
    assertClose(R.MSE([1, 2, 3], [2, 2, 5]), 5 / 6);
});
test("normal: symetrique", () => {
    assertClose(R.MSE([1, 5], [3, 2]), R.MSE([3, 2], [1, 5]));
});
test("normal: toujours >= 0", () => {
    for (let i = 0; i < 200; i++) {
        const y = [Math.random() - 0.5, Math.random() * 10];
        const p = [Math.random() * -3, Math.random()];
        assert(R.MSE(y, p) >= 0);
    }
});
test("extreme: un seul exemple", () => {
    assertEq(R.MSE([3], [1]), 2);
});
test("extreme: ecarts minuscules (1e-8)", () => {
    const r = R.MSE([1, 1], [1 + 1e-8, 1 - 1e-8]);
    assert(r > 0 && r < 1e-15, `recu ${r}`);
});
test("extreme: 100 000 exemples", () => {
    const y = new Array(100000).fill(1);
    const p = new Array(100000).fill(0);
    assertClose(R.MSE(y, p), 0.5);
});
test("extreme: listes vides -> NaN (aucune donnee)", () => {
    assert(Number.isNaN(R.MSE([], [])), `recu ${R.MSE([], [])}`);
});
test("impossible: NaN dans les predictions -> NaN", () => {
    assert(Number.isNaN(R.MSE([1, 2], [NaN, 2])));
});
test("impossible: null leve une erreur", () => {
    assertThrows(() => R.MSE(null, [1]));
});

// ---------- erreurs ----------
console.log("\nerreurs");
test("normal: yWish - yResalt", () => {
    assertJson(R.erreurs([5, 5, 0], [3, 7, 0]), [2, -2, 0]);
});
test("normal: une erreur par exemple", () => {
    assertEq(R.erreurs([1, 2, 3, 4], [0, 0, 0, 0]).length, 4);
});
test("normal: ne modifie pas les entrees", () => {
    const y = [1, 2];
    const p = [0, 1];
    R.erreurs(y, p);
    assertJson(y, [1, 2]);
    assertJson(p, [0, 1]);
});
test("extreme: listes vides -> []", () => {
    assertJson(R.erreurs([], []), []);
});
test("impossible: yResalt plus court -> NaN pour les manquants", () => {
    const r = R.erreurs([1, 2], [1]);
    assertEq(r[0], 0);
    assert(Number.isNaN(r[1]));
});
test("impossible: null leve une erreur", () => {
    assertThrows(() => R.erreurs(null, [1]));
});

// ---------- gradiant ----------
console.log("\ngradiant");
// MSE en fonction des poids, pour comparer avec une derivee numerique
function cout(a, b, x, y) {
    return R.MSE(y, x.map(xi => R.predict(a, xi, b)));
}

test("normal: erreurs nulles -> gradient nul", () => {
    const g = R.gradiant([0, 0], [[1, 2], [3, 4]], 2);
    g.a.forEach(v => assertClose(v, 0));
    assertClose(g.b, 0);
});
test("normal: retourne { a, b } avec a de taille wSize", () => {
    const g = R.gradiant([1, 1, 1], [[1, 2, 3], [1, 2, 3], [1, 2, 3]], 3);
    assert(Array.isArray(g.a), "g.a doit etre un tableau");
    assertEq(g.a.length, 3);
    assert(Number.isFinite(g.b), "g.b doit etre un nombre");
});
test("normal: valeur connue", () => {
    // erreurs = yWish - yPredict, gradient = -(1/m) * somme(err * x)
    const g = R.gradiant([1, 2], [[1, 0], [0, 1]], 2);
    assertClose(g.a[0], -0.5);
    assertClose(g.a[1], -1);
    assertClose(g.b, -1.5);
});
test("normal: egal a la derivee numerique de MSE", () => {
    const x = [[1, 2, 0.5], [0.3, -1, 2], [4, 0, -2], [1, 1, 1]];
    const y = [3, -1, 2, 0.5];
    const a = [0.2, -0.4, 0.7];
    const b = 0.1;
    const yP = x.map(xi => R.predict(a, xi, b));
    const g = R.gradiant(R.erreurs(y, yP), x, a.length);
    const h = 1e-6;
    a.forEach((_, i) => {
        const aPlus = [...a]; aPlus[i] += h;
        const aMoins = [...a]; aMoins[i] -= h;
        const num = (cout(aPlus, b, x, y) - cout(aMoins, b, x, y)) / (2 * h);
        assertClose(g.a[i], num, 1e-5, `poids ${i}`);
    });
    const numB = (cout(a, b + h, x, y) - cout(a, b - h, x, y)) / (2 * h);
    assertClose(g.b, numB, 1e-5, "biais");
});
test("normal: ne modifie pas les entrees", () => {
    const err = [1, -1];
    const x = [[1, 2], [3, 4]];
    R.gradiant(err, x, 2);
    assertJson(err, [1, -1]);
    assertJson(x, [[1, 2], [3, 4]]);
});
test("extreme: un seul exemple", () => {
    const g = R.gradiant([2], [[3]], 1);
    assertClose(g.a[0], -6);
    assertClose(g.b, -2);
});
test("extreme: aucune variable (wSize 0) -> seulement le biais", () => {
    const g = R.gradiant([1, 3], [[], []], 0);
    assertJson(g.a, []);
    assertClose(g.b, -2);
});
test("impossible: x null leve une erreur", () => {
    assertThrows(() => R.gradiant([1], null, 1));
});

// ---------- update ----------
console.log("\nupdate");
test("normal: w - lr * g", () => {
    const r = R.update([1, 2], 0.5, [0.1, -0.2], 0.4, 0.5);
    assertClose(r.a[0], 0.95);
    assertClose(r.a[1], 2.1);
    assertClose(r.b, 0.3);
});
test("normal: lr = 0 -> poids inchanges", () => {
    const r = R.update([1, 2], 3, [5, 5], 5, 0);
    assertJson(r.a, [1, 2]);
    assertEq(r.b, 3);
});
test("normal: gradient nul -> poids inchanges", () => {
    const r = R.update([1, 2], 3, [0, 0], 0, 0.1);
    assertJson(r.a, [1, 2]);
    assertEq(r.b, 3);
});
test("normal: ne modifie pas les poids d'entree", () => {
    const a = [1, 2];
    R.update(a, 0, [1, 1], 1, 0.1);
    assertJson(a, [1, 2]);
});
test("normal: un pas de gradient fait baisser la MSE", () => {
    const x = [[1, 2], [2, 1], [3, 3]];
    const y = [5, 4, 9];
    const a = [0, 0];
    const b = 0;
    const g = R.gradiant(R.erreurs(y, x.map(xi => R.predict(a, xi, b))), x, 2);
    const u = R.update(a, b, g.a, g.b, 0.01);
    assert(cout(u.a, u.b, x, y) < cout(a, b, x, y), "la MSE n'a pas baisse");
});
test("extreme: aucun poids", () => {
    const r = R.update([], 1, [], 1, 0.5);
    assertJson(r.a, []);
    assertEq(r.b, 0.5);
});
test("impossible: gA plus court -> NaN (pas un faux nombre)", () => {
    assert(Number.isNaN(R.update([1, 2], 0, [1], 0, 0.1).a[1]));
});

// ---------- training ----------
console.log("\ntraining");
// y = 2x + 1
const x1 = [[0], [0.25], [0.5], [0.75], [1]];
const y1 = x1.map(([v]) => 2 * v + 1);
// y = 3x1 - 2x2 + 0.5
const x2 = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.2], [0.3, 0.8]];
const y2 = x2.map(([a, b]) => 3 * a - 2 * b + 0.5);

test("normal: retrouve y = 2x + 1", () => {
    const r = R.training([0], x1, 0, y1, 0.5, 2000);
    assertClose(r.a[0], 2, 1e-3, "pente");
    assertClose(r.b, 1, 1e-3, "biais");
});
test("normal: retrouve y = 3x1 - 2x2 + 0.5", () => {
    const r = R.training([0, 0], x2, 0, y2, 0.5, 5000);
    assertClose(r.a[0], 3, 1e-3, "a1");
    assertClose(r.a[1], -2, 1e-3, "a2");
    assertClose(r.b, 0.5, 1e-3, "biais");
});
test("normal: une MSE par epoque", () => {
    assertEq(R.training([0], x1, 0, y1, 0.1, 37).mse.length, 37);
});
test("normal: epoque par defaut = 50", () => {
    assertEq(R.training([0], x1, 0, y1, 0.1).mse.length, 50);
});
test("normal: la MSE descend a chaque epoque (bon lr)", () => {
    const { mse } = R.training([0, 0], x2, 0, y2, 0.1, 200);
    mse.forEach((v, i) => {
        if (i) assert(v <= mse[i - 1] + 1e-12, `remonte a l'epoque ${i}: ${mse[i - 1]} -> ${v}`);
    });
});
test("normal: ne modifie pas les poids ni les donnees d'entree", () => {
    const a = [0, 0];
    const xCopie = JSON.stringify(x2);
    R.training(a, x2, 0, y2, 0.1, 10);
    assertJson(a, [0, 0]);
    assertEq(JSON.stringify(x2), xCopie);
});
test("extreme: 0 epoque -> poids de depart, mse vide", () => {
    const r = R.training([1, 2], x2, 3, y2, 0.1, 0);
    assertJson(r.a, [1, 2]);
    assertEq(r.b, 3);
    assertJson(r.mse, []);
});
test("extreme: poids deja parfaits -> MSE 0 et poids inchanges", () => {
    const r = R.training([2], x1, 1, y1, 0.5, 20);
    assertClose(r.a[0], 2);
    assertClose(r.b, 1);
    r.mse.forEach(v => assertClose(v, 0));
});
test("extreme: lr = 0 -> rien n'apprend", () => {
    const r = R.training([0], x1, 0, y1, 0, 20);
    assertJson(r.a, [0]);
    assertEq(r.b, 0);
});
test("extreme: lr trop grand -> la MSE explose (mauvais alpha detecte)", () => {
    const { mse } = R.training([0, 0], x2, 0, y2, 5, 30);
    assert(!(mse[mse.length - 1] < mse[0]), `devrait diverger: ${mse[0]} -> ${mse[mse.length - 1]}`);
});
test("extreme: un seul exemple", () => {
    const r = R.training([0], [[1]], 0, [4], 0.1, 500);
    assertClose(R.predict(r.a, [1], r.b), 4, 1e-6);
});
test("extreme: toutes les MSE sont finies (bon lr)", () => {
    const { mse } = R.training([0, 0], x2, 0, y2, 0.5, 1000);
    assert(mse.every(Number.isFinite), "valeur non finie");
});
test("impossible: x null leve une erreur", () => {
    assertThrows(() => R.training([0], null, 0, [1], 0.1, 5));
});
test("impossible: yWish null leve une erreur", () => {
    assertThrows(() => R.training([0], [[1]], 0, null, 0.1, 5));
});

// ---------- bilan ----------
console.log(`\n${passes} reussis, ${fails} echoues`);
if (fails) {
    console.log("Echecs:\n - " + failures.join("\n - "));
    process.exit(1);
}
