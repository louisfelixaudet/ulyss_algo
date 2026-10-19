/*
    Word2Vecter

    take data in this format:
    data = [text1, text2, text3];
*/

export function getRandomInt(min, max) {
    return Math.random() * (max - min) + min;
}

export function makeDict(data) {
    let trashID = [];
    let trashName = new Map();
    let dict = [];
    let index = new Map();
    let id = 0;

    data.forEach(text => {
        text.split(" ").forEach(word => {
            if (trashName.has(word)) {
                trashID[trashName.get(word)][1] += 1;
                if (trashID[trashName.get(word)][1] > 3 && !(dict.includes(word))) {
                    dict.push(word);
                }
            } else {
                trashName.set(word, id);
                trashID.push([word, 1]);
                id++;
            }
        });
    });

    id = 0

    dict.forEach(word => {
        index.set(word, id);
        id++
    });

    return { mots: dict, index };
}

export function createPaires(data, index, fenetre = 2) {
    let words = [];
    data.forEach(text => {

        let wordInText = text.split(" ").filter(word => index.has(word));

        for (let i = 0; i < wordInText.length; i++) {
            let start = Math.max(0, i - fenetre);
            let end = Math.min(wordInText.length, i + fenetre + 1);

            let context = wordInText.slice(start, end);
            context.forEach((wordContext, k) => {
                if (start + k !== i) {
                    words.push([index.get(wordInText[i]), index.get(wordContext)]);
                }
            });
        }
    });
    return words;

    /*

        1. chaque lettre refaire a un id de la table W1

        [
            [0, 1],
            [0, 2],
            [1, 0],
            [1, 2],
            ...
        ]

    */
}

export function createTab(Dict, D = 75) {
    const W1 = [];
    const W2 = [];

    let DictLength = Dict.length;

    for (let i = 0; i < DictLength; i++) {
        let listDW1 = [];
        let listDW2 = [];
        for (let j = 0; j < D; j++) {
            listDW1.push(getRandomInt(-1 * (0.5 / D), (0.5 / D)));
            listDW2.push(0);
        }
        W1.push(listDW1);
        W2.push(listDW2);
    }
    return [W1, W2];

    /*

        1. chaque mot est a la meme position que dans dictionnaire

        [
            [0.004, 0.02, 0.031, ...],
            [0.003, 0.014, 0.05, ...],
            [0.093, 0.045, 0.043, ...],
            [0.021, 0.069, 0.009, ...]
        ]

    */

}

// score multiplication de deux vecteurs (donne un nombre)
export function dot(a, b) {
    let score = 0;
    a.forEach((vd, i) => {
        score += vd * b[i];
    });
    return score;
}

// augmente ou diminue un vecteur selon n
export function scale(a, n) {
    let b = [];
    a.forEach(vd => {
        b.push(vd * n);
    });
    return b;
}

// additionne deux vecteurs de meme longueur
export function add(a, b) {
    let newV = [];
    a.forEach((vd, i) => {
        newV.push(vd + b[i]);
    });
    return newV;
}

export function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

export function KnuthShuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

export function step(wordv, voisin, negatifs, taux) {
    // cible true et false
    const TV = 1;
    const TN = 0;
    
    // creer gv vecteur de correction de wordv
    let gv = [];
    wordv.forEach(dim => {
        gv.push(0);
    });

    // calculer avec le vrai voisin
    let s = dot(wordv, voisin);
    let p = sigmoid(s);
    let err = TV - p;
    gv = add(gv, scale(voisin, taux * err));
    voisin = add(voisin, scale(wordv, taux * err));

    // calculer avec les negatif
    negatifs.forEach((faux, i, tabsFaux) => {
        let s = dot(wordv, faux);
        let p = sigmoid(s);
        let err = TN - p;
        gv = add(gv, scale(faux, taux * err));
        faux = add(faux, scale(wordv, taux * err));
        tabsFaux[i] = faux;
    });

    // modifier wordv
    wordv = add(wordv, gv);

    return { v: wordv, u: voisin, n: negatifs }

}

export function getNegatif(centre, voisins, N, k) {
    let negatifs = [];
    let r = 0;
    for (let i = 0; negatifs.length < k; i++) {
        r = Math.floor(getRandomInt(0, N));
        if (centre !== r && !(voisins.has(r))) {
            negatifs.push(r);
        }
    }
    return negatifs;
}

export function training(W1, W2, paires, nbNegatif = 5, epoques = 100, taux = 0.05) {
    // params
    let lr = 0;

    // construire paire de verification pour voisin
    const mapPaires = new Map();

    paires.forEach(paire => {
        // comparer pour savoir si cest toujours le meme mot au centre
        if(!mapPaires.has(paire[0])) mapPaires.set(paire[0], new Set());
        mapPaires.get(paire[0]).add(paire[1]);
    });

    // boucler sur les epoques
    for(let i = 0;  i < epoques; i++){
        // melanger la liste de paires
        let pairesTraining = KnuthShuffle(paires);

        // calculer le nouveau taux de training
        lr = taux / (i + 1); 

        // boucler sur chaque paire et faire le training
        pairesTraining.forEach(paire => {
            let vecteurNega = [];

            //get paire value
            let centre = paire[0];
            let voisin = paire[1];

            // get faux voisins
            let listNegatifs = getNegatif(centre, mapPaires.get(centre), W1.length, nbNegatif);

            // get leurs vecteurs

            // negatifs
            listNegatifs.forEach(idnega => {
                vecteurNega.push(W2[idnega]);
            });

            // voisin
            let vecteurVoisin = W2[voisin];

            // centre
            let vecteurCentre = W1[centre];

            // appeler Step
            let result = step(vecteurCentre, vecteurVoisin, vecteurNega, lr);

            // reecrir les valeurs dans W1 et W2
            W1[centre] = result.v;
            W2[voisin] = result.u;

            for (let j = 0; j < listNegatifs.length; j++) {
                W2[listNegatifs[j]] = result.n[j];
            }

        });

    }

    return { W1: W1, W2: W2 }

}