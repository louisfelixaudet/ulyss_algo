/*
    Creation dun neurone
    
    Data sur la video:
    - Difficulter du prof
    - Difficulter selon le prof
    - Taux de reussite autre
    - Resultat des videos similaires

    Resultat neurone: Difficulter dune video

    - 
       - 
         -          - 
           -    -       - 
    - - - - - -     N     - - - - - R
           -    -       -
         -          -  
       - 
    -

    Partie 1: Predire

        etape1: recevoir les entrees de nombre entre 0 et 1
        etape2: Multiplier chaque entree par son poids
        etape3: ajouter les biais
        etape4: fonction dactivation
    
    Partie 2: Apprendres (pendant lentrainement)

        etape5: mesurer lerreur erreur = reponse attendu - sortie
        etape6: corriger chaque poids et biais new weight = old weight + a * entree * erreur
                param:  a = taux dapprentissage

    data structure:

        data de training -> [
            [0.3, 0.24, 0.78, 0. 9],
            [0.3, 0.24, 0.78, 0. 9],
            [0.3, 0.24, 0.78, 0. 9],
            [0.3, 0.24, 0.78, 0. 9],
            ...
        ]

        biais -> nombre unique

        poids -> [4, 2, 9, 10]

        reponse attendu -> [ 0.75, 0.45, ... ]


*/
function KnuthShuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}


const neuron = (x, w, b) => sigmoid(x.reduce((s, xi, i) => {
   return s + xi * w[i]
}, b));

function learning(resp, neuronR, valueIn, w, a, b){
    let error = resp - neuronR;

    w.forEach((weight, k) => {
        w[k] = weight + a * valueIn[k] * error;
    });

    b = b + a * error;

    return { w, b };
}


function trainingNeuron(xData, w, b, resp, a = 0.5, epoques = 100){
    let dataTraining = xData;
    let copieWeight = w

    for (let i = 0; i < epoques; i++) {
        xData.forEach((values, j) => {
            let nResalt = neuron(values, copieWeight, b);
            lr = learning(resp[j], nResalt, values, copieWeightw, a);
            b = lr.b;
            copieWeight = lr.w;
        });

        dataTraining = KnuthShuffle(xData);

    }

    return { w: copieWeight, b };
}
