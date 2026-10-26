/*
    Tests de engagement.js avec des scores minuscules, moyens et plausibles (cas reels)
    Lancer: npm run startETest

    Chaque cas affiche ses parametres et le resultat.
*/

import { engagement, nbComCat, burnValue2Sigmoide, video2Engagement, sortCom } from "../engagement.js";
import * as params from "../../../param/paramRegressionLogistique/paramEngagement.js";

console.log("Coefficients:", {
    like: params.COEFLIKE,
    view: params.COEFVIEW,
    comPos: params.COEFCOMPOS,
    comNeg: params.COEFCOMNEG,
    partage: params.COEFPARTAGE,
    quizz: params.COEFQUIZZ,
    age: params.COEFAGE
});

// parametres de chaque cas: engagement(like, view, comPos, comNeg, partage, quizzRepondu, quizzMontre, age)
const cas = [
    // ----- minuscule -----
    { nom: "minuscule: video neuve sans interaction", p: [0, 0, 0, 0, 0, 0, 10, 1] },
    { nom: "minuscule: petite chaine, 1 jour", p: [2, 40, 0, 0, 0, 1, 5, 1] },
    { nom: "minuscule: petite chaine, 7 jours", p: [3, 85, 1, 0, 0, 2, 10, 7] },
    { nom: "minuscule: flop avec commentaires negatifs", p: [1, 120, 0, 4, 0, 0, 10, 3] },

    // ----- moyen -----
    { nom: "moyen: video educative classique, 3 jours", p: [150, 2500, 12, 2, 8, 30, 50, 3] },
    { nom: "moyen: video d'une semaine", p: [320, 6200, 25, 5, 20, 45, 60, 7] },
    { nom: "moyen: bonne video mais vieille (60 jours)", p: [800, 15000, 40, 10, 35, 120, 150, 60] },
    { nom: "moyen: beaucoup de vues, peu de likes", p: [90, 12000, 5, 3, 4, 20, 100, 10] },

    // ----- plausible grand -----
    { nom: "plausible: video virale, 2 jours", p: [18000, 250000, 900, 120, 1500, 800, 1000, 2] },
    { nom: "plausible: tres bien quizz (tous repondus)", p: [500, 8000, 30, 2, 25, 60, 60, 5] },
    { nom: "plausible: polemique (beaucoup de com negatifs)", p: [400, 20000, 50, 600, 10, 40, 100, 4] },

    // ----- comparaison meme video selon l'age -----
    { nom: "age: meme video a 1 jour", p: [200, 3000, 15, 3, 10, 25, 50, 1] },
    { nom: "age: meme video a 10 jours", p: [200, 3000, 15, 3, 10, 25, 50, 10] },
    { nom: "age: meme video a 100 jours", p: [200, 3000, 15, 3, 10, 25, 50, 100] }
];

const resultats = {};
cas.forEach(({ nom, p }, i) => {
    const [like, view, comPos, comNeg, partage, qR, qM, age] = p;
    const r = engagement(...p);
    resultats[nom] = r;
    console.log(`\n#${i + 1} ${nom}`);
    console.log(`   like=${like} view=${view} comPos=${comPos} comNeg=${comNeg} partage=${partage} quizz=${qR}/${qM} age=${age}j`);
    console.log(`   => engagement = ${r}`);
});

// verifications de coherence
console.log("\n--- verifications ---");
let fails = 0;
function check(nom, cond) {
    console.log(`  ${cond ? "ok  " : "FAIL"} ${nom}`);
    if (!cond) fails++;
}
check("tous les resultats sont des nombres finis", Object.values(resultats).every(Number.isFinite));
check("viral > moyen > minuscule",
    resultats["plausible: video virale, 2 jours"] > resultats["moyen: video educative classique, 3 jours"] &&
    resultats["moyen: video educative classique, 3 jours"] > resultats["minuscule: petite chaine, 1 jour"]);
check("plus la video vieillit, plus le score baisse",
    resultats["age: meme video a 1 jour"] > resultats["age: meme video a 10 jours"] &&
    resultats["age: meme video a 10 jours"] > resultats["age: meme video a 100 jours"]);
check("polemique < video comparable sans com negatifs",
    resultats["plausible: polemique (beaucoup de com negatifs)"] < engagement(400, 20000, 50, 0, 10, 40, 100, 4));
check("video sans interaction = 0", resultats["minuscule: video neuve sans interaction"] === 0);

// ---------- nouvelles fonctions ----------
// knnPrediction affiche ses voisins: on coupe le bruit pendant les appels
function quiet(fn) {
    const log = console.log;
    console.log = () => {};
    try {
        return fn();
    } finally {
        console.log = log;
    }
}

// verifie un cas et affiche le resultat meme en cas d'erreur
function essai(nom, fn) {
    console.log(`\n${nom}`);
    try {
        const r = fn();
        console.log("   => ", r);
        return r;
    } catch (e) {
        console.log(`   => ERREUR: ${e.message}`);
        check(`${nom}: ne plante pas`, false);
        return undefined;
    }
}

// commentaires deja classes: [texte, 1 positif | 0 negatif]
const allCom = [
    // positifs
    ["super video merci beaucoup", 1],
    ["super explication merci", 1],
    ["super contenu continue comme ca", 1],
    ["merci pour cette video tres claire", 1],
    ["merci j ai enfin compris", 1],
    ["merci beaucoup c est parfait", 1],
    ["excellent contenu continue comme ca", 1],
    ["excellent travail bravo", 1],
    ["excellente explication tres utile", 1],
    ["j adore cette chaine", 1],
    ["j adore ta facon d expliquer", 1],
    ["j adore cette video", 1],
    ["genial j ai enfin compris", 1],
    ["genial merci pour l aide", 1],
    ["genial video tres bien faite", 1],
    ["bravo c est clair et utile", 1],
    ["bravo pour cette video", 1],
    ["bravo tres bonne explication", 1],
    ["tres bien explique j ai tout compris", 1],
    ["tres bonne video merci", 1],
    ["tres interessant et utile", 1],
    ["video tres interessante", 1],
    ["video claire et bien faite", 1],
    ["parfait c est exactement ce qu il me fallait", 1],
    ["merci cette explication est parfaite", 1],
    ["magnifique travail continue", 1],
    ["top video merci pour tout", 1],
    ["tres utile pour mes revisions merci", 1],
    ["excellent cours j ai tout compris", 1],
    ["je recommande cette chaine elle est super", 1],
    // negatifs
    ["nul je n ai rien compris", 0],
    ["nul cette video est inutile", 0],
    ["nul tout est faux", 0],
    ["tout est faux dans cette video", 0],
    ["tout est faux et mal explique", 0],
    ["c est faux et mal explique", 0],
    ["tres mauvais contenu", 0],
    ["tres mauvaise explication", 0],
    ["tres mauvais cours je n ai rien compris", 0],
    ["je deteste cette chaine", 0],
    ["je deteste cette video", 0],
    ["je n aime pas du tout cette video", 0],
    ["perte de temps explication confuse", 0],
    ["quelle perte de temps", 0],
    ["video ennuyeuse et inutile", 0],
    ["video ennuyeuse et trop longue", 0],
    ["inutile et confus", 0],
    ["arretez de dire n importe quoi", 0],
    ["c est n importe quoi", 0],
    ["rien compris explication confuse", 0],
    ["explication nulle et confuse", 0],
    ["decevant video mal faite", 0],
    ["mauvais travail c est faux", 0],
    ["horrible je n ai rien compris", 0],
    ["c est nul et faux", 0],
    ["trop long et ennuyeux", 0],
    ["pas clair du tout rien compris", 0],
    ["contenu mauvais et inutile", 0],
    ["quelle video nulle", 0],
    ["c est mauvais ne regardez pas", 0]
];

console.log("\n=== burnValue2Sigmoide ===");
const b0 = essai("score 0", () => burnValue2Sigmoide(0));
check("score 0 -> 0.5", b0 === 0.5);
const bPetit = essai("score minuscule (42)", () => burnValue2Sigmoide(42));
const bMoyen = essai("score moyen (1500)", () => burnValue2Sigmoide(1500));
const bViral = essai("score viral (235310)", () => burnValue2Sigmoide(235310));
check("toujours dans ]0.5, 1[ pour un score positif", [bPetit, bMoyen, bViral].every(x => x > 0.5 && x < 1));
check("croissant: minuscule < moyen < viral", bPetit < bMoyen && bMoyen < bViral);
const bGeant = essai("score enorme (1e12)", () => burnValue2Sigmoide(1e12));
check("score enorme reste fini et <= 1", Number.isFinite(bGeant) && bGeant <= 1);
const bNeg = essai("score negatif plausible (-50)", () => burnValue2Sigmoide(-50));
check("score negatif ne donne pas NaN", Number.isFinite(bNeg));

console.log("\n=== nbComCat ===");
const c1 = essai("3 positifs", () => quiet(() => nbComCat(["super video merci", "j adore", "genial merci"], allCom)));
check("3 positifs -> pos=3 neg=0", c1 && c1.pos === 3 && c1.neg === 0);
const c2 = essai("3 negatifs", () => quiet(() => nbComCat(["nul rien compris", "tres mauvais", "je deteste"], allCom)));
check("3 negatifs -> pos=0 neg=3", c2 && c2.pos === 0 && c2.neg === 3);
const c3 = essai("mix 2 positifs 1 negatif", () => quiet(() => nbComCat(["super merci", "excellent contenu", "tout est faux"], allCom)));
check("mix -> pos=2 neg=1", c3 && c3.pos === 2 && c3.neg === 1);
const c4 = essai("aucun commentaire", () => nbComCat([], allCom));
check("aucun commentaire -> 0 / 0", c4 && c4.pos === 0 && c4.neg === 0);

console.log("\n=== video2Engagement ===");
const videos = [
    { like: 2, view: 40, partage: 0, age: 1, com: ["nul rien compris"], quizz: { repondu: 1, show: 5 } },
    { like: 150, view: 2500, partage: 8, age: 3, com: ["super video merci", "j adore", "tout est faux"], quizz: { repondu: 30, show: 50 } },
    { like: 18000, view: 250000, partage: 1500, age: 2, com: ["genial merci", "excellent contenu", "j adore"], quizz: { repondu: 800, show: 1000 } }
];
const e = essai("3 videos (minuscule, moyenne, virale)", () => quiet(() => video2Engagement(videos, allCom)));
check("une valeur par video", e && e.length === 3);
check("toutes les valeurs dans ]0.5, 1[", e && e.every(x => x > 0.5 && x < 1));
check("ordre minuscule < moyenne < virale", e && e[0] < e[1] && e[1] < e[2]);
const eVide = essai("aucune video", () => video2Engagement([], allCom));
check("aucune video -> []", eVide && eVide.length === 0);

console.log("\n=== sortCom ===");
// format: [idVideo, commentaire, type] (type undefined = a classer)
// base d'entrainement = allCom (3 commentaires par video) + 2 commentaires a classer
const comClasses = allCom.map(([texte, type], i) => [Math.floor(i / 3) + 1, texte, type]);
const comTrain = [
    ...comClasses,
    [100, "super merci", undefined],
    [101, "nul tout est faux", undefined]
];
const s = essai(`2 commentaires a classer parmi ${comTrain.length}`, () => quiet(() => sortCom(comTrain)));
check("retourne seulement les commentaires non classes", s && s.length === 2);
check("garde idVideo et texte", s && s[0] && s[0][0] === 100 && s[0][1] === "super merci" && s[1][0] === 101);
check("'super merci' classe positif (1)", s && s[0] && s[0][2] === 1);
check("'nul tout est faux' classe negatif (0)", s && s[1] && s[1][2] === 0);
const sRien = essai("tous deja classes", () => quiet(() => sortCom(comClasses)));
check("tous classes -> []", sRien && sRien.length === 0);

console.log(`\n${fails ? fails + " verification(s) echouee(s)" : "tout est ok"}`);
if (fails) process.exit(1);
