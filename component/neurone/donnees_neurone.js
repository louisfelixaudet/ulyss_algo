/*
    Jeu de donnees de test pour neurone.js

    Les entrees sont dans [0, 1] et la sortie vaut sigmoid(w . x + b) avec une regle connue
    (VRAIS_POIDS / VRAI_BIAIS), ce qui permet de verifier que le neurone retrouve la regle.
    Generation deterministe (PRNG avec graine).

    Entrees (comme dans neurone.js):
      [difficulte du prof, difficulte selon le prof, taux de reussite autre, resultat des videos similaires]
*/

export const VRAIS_POIDS = [3, -2, 1.5, 2.5];
export const VRAI_BIAIS = -1.5;

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const sigmoid = x => 1 / (1 + Math.exp(-x));

export function reponseAttendue(x) {
    return sigmoid(x.reduce((s, xi, i) => s + xi * VRAIS_POIDS[i], VRAI_BIAIS));
}

// bruit: amplitude max ajoutee a la sortie (0 = donnees parfaites)
export function genererDonnees(n = 500, graine = 42, bruit = 0) {
    const rand = mulberry32(graine);
    const X = [];
    const resp = [];
    for (let i = 0; i < n; i++) {
        const x = VRAIS_POIDS.map(() => rand());
        const r = reponseAttendue(x) + (rand() * 2 - 1) * bruit;
        X.push(x);
        resp.push(Math.min(1, Math.max(0, r)));
    }
    return { X, resp };
}
