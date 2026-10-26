/*
    Tests unitaires pour sousCategorie.js
    Lancer: npm run startSCTest

    Pour chaque fonction: valeurs normales, extremes et impossibles.
*/

import * as S from "../sousCategorie.js";
import * as W from "#word2vecter";

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

// ---------- combineText ----------
console.log("\ncombineText");
test("normal: combine 4 textes en une string", () => {
    const r = S.combineText("desc", "titre", "titre quizz", "question");
    assertEq(typeof r, "string", "doit retourner une string");
    ["desc", "titre", "titre quizz", "question"].forEach(t => assert(r.includes(t), `"${t}" manquant`));
});
test("normal: l'ordre des textes est conserve", () => {
    const r = S.combineText("un", "deux", "trois");
    assert(r.indexOf("un") < r.indexOf("deux") && r.indexOf("deux") < r.indexOf("trois"), "ordre perdu");
});
test("extreme: aucun argument -> string vide (ou espaces)", () => {
    const r = S.combineText();
    assertEq(typeof r, "string");
    assertEq(r.trim(), "");
});
test("extreme: un seul argument", () => {
    assertEq(S.combineText("seul").trim(), "seul");
});
test("extreme: tres long texte (100 000 mots)", () => {
    const long = new Array(100000).fill("mot").join(" ");
    const r = S.combineText(long, "fin");
    assert(r.includes("fin") && r.length >= long.length);
});
test("extreme: chaines vides", () => {
    assertEq(S.combineText("", "", "").trim(), "");
});
test("impossible: undefined / null ne doivent pas ecrire 'undefined' ou 'null'", () => {
    const r = S.combineText("ok", undefined, null);
    assert(!r.includes("undefined") && !r.includes("null"), `texte pollue: "${r}"`);
});

// ---------- supprimerLittleWord ----------
console.log("\nsupprimerLittleWord");
test("normal: supprime les mots sous le score mini", () => {
    const r = S.supprimerLittleWord("chat le chien", { chat: 0.5, le: 0.01, chien: 0.9 });
    assertEq(r, "chat chien");
});
test("normal: mot inconnu du tableau est conserve", () => {
    const r = S.supprimerLittleWord("chat inconnu", { chat: 0.5 });
    assertEq(r, "chat inconnu");
});
test("extreme: score exactement egal au seuil (0.12) est conserve", () => {
    assertEq(S.supprimerLittleWord("pile", { pile: 0.12 }), "pile");
});
test("extreme: score juste sous le seuil est supprime", () => {
    assertEq(S.supprimerLittleWord("bas", { bas: 0.1199 }), "");
});
test("extreme: score 0 est supprime", () => {
    assertEq(S.supprimerLittleWord("zero mot", { zero: 0, mot: 1 }), "mot");
});
test("extreme: score enorme conserve", () => {
    assertEq(S.supprimerLittleWord("gros", { gros: 1e12 }), "gros");
});
test("extreme: texte vide", () => {
    assertEq(S.supprimerLittleWord("", { a: 1 }), "");
});
test("extreme: tableau de scores vide -> tout conserve", () => {
    assertEq(S.supprimerLittleWord("a b c", {}), "a b c");
});
test("impossible: score negatif est supprime", () => {
    assertEq(S.supprimerLittleWord("neg ok", { neg: -5, ok: 1 }), "ok");
});
test("impossible: score NaN est supprime", () => {
    assertEq(S.supprimerLittleWord("nan ok", { nan: NaN, ok: 1 }), "ok");
});
test("impossible: stringData non string leve une erreur", () => {
    assertThrows(() => S.supprimerLittleWord(null, {}));
    assertThrows(() => S.supprimerLittleWord(undefined, {}));
    assertThrows(() => S.supprimerLittleWord(123, {}));
});
test("impossible: tabTFIDFscore null leve une erreur", () => {
    assertThrows(() => S.supprimerLittleWord("a b", null));
});

// ---------- newDataCat ----------
console.log("\nnewDataCat");
const docs = [
    { desc: "le chat dort", title: "chat", titleQuizz: "quizz chat", questQizz: "ou dort le chat" },
    { desc: "le chien court", title: "chien", titleQuizz: "quizz chien", questQizz: "ou court le chien" }
];
const scores = { le: 0.01, ou: 0.01, chat: 1, chien: 1, dort: 1, court: 1, quizz: 1 };

test("normal: une string par document", () => {
    const r = S.newDataCat(docs, scores);
    assertEq(r.length, 2);
    r.forEach(t => assertEq(typeof t, "string"));
});
test("normal: les petits mots sont retires, les autres gardes", () => {
    const r = S.newDataCat(docs, scores);
    assert(r[0].includes("chat") && r[0].includes("dort"), `doc 0: "${r[0]}"`);
    assert(!r[0].split(" ").includes("le"), `"le" encore present: "${r[0]}"`);
    assert(r[1].includes("chien") && r[1].includes("court"), `doc 1: "${r[1]}"`);
});
test("extreme: liste de documents vide", () => {
    assertJson(S.newDataCat([], scores), []);
});
test("extreme: document avec tous les champs vides", () => {
    const r = S.newDataCat([{ desc: "", title: "", titleQuizz: "", questQizz: "" }], scores);
    assertEq(r.length, 1);
    assertEq(r[0].trim(), "");
});
test("extreme: 10 000 documents", () => {
    const gros = Array.from({ length: 10000 }, () => docs[0]);
    assertEq(S.newDataCat(gros, scores).length, 10000);
});
test("extreme: ne modifie pas les documents d'entree", () => {
    const copie = JSON.stringify(docs);
    S.newDataCat(docs, scores);
    assertEq(JSON.stringify(docs), copie);
});
test("impossible: document sans champs ne doit pas produire 'undefined'", () => {
    const r = S.newDataCat([{}], scores);
    assert(!r[0].includes("undefined"), `texte pollue: "${r[0]}"`);
});
test("impossible: data null leve une erreur", () => {
    assertThrows(() => S.newDataCat(null, scores));
});
test("impossible: document null leve une erreur", () => {
    assertThrows(() => S.newDataCat([null], scores));
});

// ---------- vecterTab ----------
console.log("\nvecterTab");
// chaque mot apparait >= 4 fois pour passer le filtre de makeDict
const corpus = [
    "chat dort chat dort chat dort chat dort",
    "chien court chien court chien court chien court"
];

test("normal: retourne W1 et index coherents", () => {
    const r = S.vecterTab(corpus);
    assert(Array.isArray(r.W1) && r.W1.length === 4, `W1 de ${r.W1 && r.W1.length} lignes`);
    assertEq(r.index.size, 4);
    r.W1.forEach(v => assertEq(v.length, 75));
});
test("normal: aucune valeur NaN / Infinity", () => {
    const r = S.vecterTab(corpus);
    assert(r.W1.every(v => v.every(Number.isFinite)), "valeur non finie");
});
test("extreme: corpus vide -> W1 vide", () => {
    const r = S.vecterTab([]);
    assertEq(r.W1.length, 0);
    assertEq(r.index.size, 0);
});
test("extreme: aucun mot assez frequent -> W1 vide", () => {
    const r = S.vecterTab(["un deux trois"]);
    assertEq(r.W1.length, 0);
});
test("impossible: dataImp null leve une erreur", () => {
    assertThrows(() => S.vecterTab(null));
});

// ---------- getVideoContext ----------
console.log("\ngetVideoContext");
// W1 a la main: 2 dimensions, on controle les moyennes
const W1 = [[1, 0], [0, 1], [3, 3]];
const indexMap = new Map([["a", 0], ["b", 1], ["c", 2]]);

test("normal: moyenne des vecteurs des mots d'une video", () => {
    const r = S.getVideoContext(["a b"], W1, indexMap);
    assertEq(r.length, 1);
    assertClose(r[0][0], 0.5);
    assertClose(r[0][1], 0.5);
});
test("normal: un vecteur par video, independants entre eux", () => {
    const r = S.getVideoContext(["a", "b", "c"], W1, indexMap);
    assertEq(r.length, 3);
    assertJson(r[0], [1, 0]);
    assertJson(r[1], [0, 1]);
    assertJson(r[2], [3, 3]);
});
test("normal: mot repete pese plus", () => {
    const r = S.getVideoContext(["a a b"], W1, indexMap);
    assertClose(r[0][0], 2 / 3);
    assertClose(r[0][1], 1 / 3);
});
test("extreme: liste de videos vide", () => {
    assertJson(S.getVideoContext([], W1, indexMap), []);
});
test("extreme: video d'un seul mot", () => {
    assertJson(S.getVideoContext(["c"], W1, indexMap)[0], [3, 3]);
});
test("extreme: video de 10 000 mots reste fini", () => {
    const r = S.getVideoContext([new Array(10000).fill("c").join(" ")], W1, indexMap);
    assertClose(r[0][0], 3, 1e-6);
});
test("extreme: mot absent du dictionnaire est ignore (pas de crash, pas de NaN)", () => {
    const r = S.getVideoContext(["a inconnu"], W1, indexMap);
    assert(r[0].every(Number.isFinite), `NaN: ${JSON.stringify(r[0])}`);
});
test("extreme: video vide -> vecteur nul fini", () => {
    const r = S.getVideoContext([""], W1, indexMap);
    assert(r[0].every(Number.isFinite), `NaN: ${JSON.stringify(r[0])}`);
});
test("impossible: W1 null leve une erreur", () => {
    assertThrows(() => S.getVideoContext(["a"], null, indexMap));
});
test("impossible: W1 vide leve une erreur", () => {
    assertThrows(() => S.getVideoContext(["a"], [], indexMap));
});
test("impossible: dataImp null leve une erreur", () => {
    assertThrows(() => S.getVideoContext(null, W1, indexMap));
});
test("integration: fonctionne avec l'index retourne par vecterTab", () => {
    const { W1: w, index } = S.vecterTab(corpus);
    const r = S.getVideoContext(["chat dort", "chien court"], w, index);
    assertEq(r.length, 2);
    r.forEach(v => assert(v.length === 75 && v.every(Number.isFinite), "vecteur invalide"));
});

// ---------- cosinus ----------
console.log("\ncosinus");
test("normal: vecteurs identiques -> 1", () => {
    assertClose(S.cosinus([1, 2, 3], [1, 2, 3]), 1);
});
test("normal: vecteurs orthogonaux -> 0", () => {
    assertClose(S.cosinus([1, 0], [0, 1]), 0);
});
test("normal: vecteurs opposes -> -1", () => {
    assertClose(S.cosinus([1, 2], [-1, -2]), -1);
});
test("normal: colineaires de normes differentes -> 1", () => {
    assertClose(S.cosinus([1, 1], [50, 50]), 1);
});
test("normal: cas connu (45 degres)", () => {
    assertClose(S.cosinus([1, 0], [1, 1]), Math.SQRT1_2);
});
test("extreme: vecteur nul -> 0 (pas de NaN)", () => {
    assertEq(S.cosinus([0, 0], [1, 2]), 0);
    assertEq(S.cosinus([0, 0], [0, 0]), 0);
});
test("extreme: vecteurs vides -> 0", () => {
    assertEq(S.cosinus([], []), 0);
});
test("extreme: valeurs minuscules (1e-100) restent exactes", () => {
    assertClose(S.cosinus([1e-100, 0], [1e-100, 0]), 1, 1e-6);
});
test("extreme: valeurs enormes (1e200) ne donnent pas Infinity/NaN", () => {
    const r = S.cosinus([1e200, 1e200], [1e200, 1e200]);
    assert(Number.isFinite(r), `non fini: ${r}`);
    assertClose(r, 1, 1e-6);
});
test("extreme: resultat toujours dans [-1, 1]", () => {
    for (let i = 0; i < 500; i++) {
        const a = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
        const b = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
        const r = S.cosinus(a, b);
        assert(r >= -1 - 1e-12 && r <= 1 + 1e-12, `hors [-1,1]: ${r}`);
    }
});
test("impossible: NaN dans un vecteur ne doit pas donner un nombre valide", () => {
    assert(Number.isNaN(S.cosinus([NaN, 1], [1, 1])) || S.cosinus([NaN, 1], [1, 1]) === 0, "resultat trompeur");
});
test("impossible: null leve une erreur", () => {
    assertThrows(() => S.cosinus(null, [1, 2]));
    assertThrows(() => S.cosinus([1, 2], undefined));
});

// ---------- creatProfil ----------
console.log("\ncreatProfil");
test("normal: moyenne de plusieurs vecteurs", () => {
    const r = S.creatProfil([[1, 2], [3, 4], [5, 6]]);
    assertJson(r, [3, 4]);
});
test("normal: un seul vecteur -> lui-meme", () => {
    assertJson(S.creatProfil([[2, -4, 6]]), [2, -4, 6]);
});
test("normal: ne modifie pas les vecteurs d'entree", () => {
    const entree = [[1, 2], [3, 4]];
    S.creatProfil(entree);
    assertJson(entree, [[1, 2], [3, 4]]);
});
test("normal: dimension du profil = dimension des videos", () => {
    const r = S.creatProfil([[1, 1, 1, 1], [2, 2, 2, 2]]);
    assertEq(r.length, 4);
});
test("extreme: vecteurs opposes -> profil nul", () => {
    assertJson(S.creatProfil([[1, 2], [-1, -2]]).map(x => x + 0), [0, 0]);
});
test("extreme: 10 000 videos identiques -> meme vecteur", () => {
    const r = S.creatProfil(new Array(10000).fill([0.5, 1]));
    assertClose(r[0], 0.5, 1e-9);
    assertClose(r[1], 1, 1e-9);
});
test("extreme: valeurs enormes restent finies", () => {
    const r = S.creatProfil([[1e300, 1e300], [1e300, 1e300]]);
    assert(r.every(Number.isFinite), `non fini: ${JSON.stringify(r)}`);
});
test("extreme: liste vide -> vecteur vide, sans NaN", () => {
    const r = S.creatProfil([]);
    assert(Array.isArray(r) && r.every(Number.isFinite), `recu ${JSON.stringify(r)}`);
});
test("impossible: null leve une erreur", () => {
    assertThrows(() => S.creatProfil(null));
});

// ---------- deleteWatched ----------
console.log("\ndeleteWatched");
const videos = [[1], [2], [3], [4]];

test("normal: retire les videos deja vues (par index)", () => {
    assertJson(S.deleteWatched([0, 2], videos), [[2], [4]]);
});
test("normal: aucune video vue -> tout est conserve", () => {
    assertJson(S.deleteWatched([], videos), videos);
});
test("normal: ne modifie pas la liste d'origine", () => {
    S.deleteWatched([1], videos);
    assertEq(videos.length, 4);
});
test("extreme: toutes les videos vues -> liste vide", () => {
    assertJson(S.deleteWatched([0, 1, 2, 3], videos), []);
});
test("extreme: liste de videos vide", () => {
    assertJson(S.deleteWatched([0, 1], []), []);
});
test("extreme: doublons dans les videos vues", () => {
    assertJson(S.deleteWatched([1, 1, 1], videos), [[1], [3], [4]]);
});
test("extreme: premier et dernier index", () => {
    assertJson(S.deleteWatched([0, 3], videos), [[2], [3]]);
});
test("impossible: index negatif ou hors limites est ignore", () => {
    assertJson(S.deleteWatched([-1, 99, 1.5], videos), videos);
});
test("impossible: videoWatch null leve une erreur", () => {
    assertThrows(() => S.deleteWatched(null, videos));
});
test("impossible: videoVecteur null leve une erreur", () => {
    assertThrows(() => S.deleteWatched([0], null));
});

// ---------- COSWithStudent ----------
console.log("\nCOSWithStudent");
test("normal: un score par sujet, valeurs dans (0, 1)", () => {
    const r = S.COSWithStudent([1, 0], [[1, 0], [0, 1], [-1, 0]]);
    assertEq(r.length, 3);
    r.forEach(x => assert(x > 0 && x < 1, `hors (0,1): ${x}`));
});
test("normal: valeurs attendues sigmoid(cos)", () => {
    const r = S.COSWithStudent([1, 0], [[1, 0], [0, 1], [-1, 0]]);
    assertClose(r[0], W.sigmoid(1));
    assertClose(r[1], 0.5);
    assertClose(r[2], W.sigmoid(-1));
});
test("normal: le sujet le plus proche a le meilleur score", () => {
    const r = S.COSWithStudent([1, 1], [[1, 1], [1, -1], [-1, -1]]);
    assert(r[0] > r[1] && r[1] > r[2], `ordre faux: ${JSON.stringify(r)}`);
});
test("extreme: aucun sujet -> liste vide", () => {
    assertJson(S.COSWithStudent([1, 2], []), []);
});
test("extreme: profil nul -> tous les scores a 0.5", () => {
    S.COSWithStudent([0, 0], [[1, 2], [3, 4]]).forEach(x => assertClose(x, 0.5));
});
test("extreme: scores bornes entre sigmoid(-1) et sigmoid(1)", () => {
    const bas = W.sigmoid(-1), haut = W.sigmoid(1);
    S.COSWithStudent([5, 5], [[1e9, 1e9], [-1e9, -1e9], [1e-9, 0]]).forEach(x =>
        assert(x >= bas - 1e-9 && x <= haut + 1e-9, `hors bornes: ${x}`));
});
test("extreme: 10 000 sujets", () => {
    const sujets = Array.from({ length: 10000 }, (_, i) => [i, 1]);
    assertEq(S.COSWithStudent([1, 1], sujets).length, 10000);
});
test("impossible: profil null leve une erreur", () => {
    assertThrows(() => S.COSWithStudent(null, [[1, 2]]));
});
test("impossible: liste de sujets null leve une erreur", () => {
    assertThrows(() => S.COSWithStudent([1, 2], null));
});

// ---------- bilan ----------
console.log(`\n${passes} reussis, ${fails} echoues`);
if (fails) {
    console.log("Echecs:\n - " + failures.join("\n - "));
    process.exit(1);
}
