/*
    algo regression lineaire  
*/

// prediction sur 3 x
export const predict = (a, x, b) => x.reduce((y, xi, i) => {
    return y + xi * a[i]
}, b)


/*
    calculer erreur pour voir si le modele diminue

    - Suivre la convergence
    - Détecter un mauvais α
    - Savoir quand arrêter
*/
export function MSE(yWish, yResalt) {

    let sommes = 0;

    yWish.forEach((yi, i) => {
        sommes += (yi - yResalt[i]) ** 2;
    });

    return 1 / (2 * yWish.length) * sommes;

}

/*

*/
export function erreurs(yWish, yResalt) {
    let yErreur = [];
    for (let i = 0; i < yWish.length; i++) {
        yErreur.push(yWish[i] - yResalt[i]);
    }
    return yErreur;
}


/*
erreurs = [
    -5,
    -11,
    ...
]

x = [
    [1, 2],
    [4, 3]
]
*/
export function gradiant(erreurs, x, wSize) {
    let arrayGradiants = [];
    let b = 0;

    for (let i = 0; i < wSize; i++) {
        arrayGradiants.push(0);
    }

    arrayGradiants.forEach((grad, i) => {
        erreurs.forEach((err, j) => {
            grad += err * x[j][i];
        });
        // erreurs = yWish - yPredict, donc la derivee de la MSE est negative
        arrayGradiants[i] = -(1 / erreurs.length) * grad;
    });

    erreurs.forEach(err => {
        b += err
    });

    b = -(1 / erreurs.length) * b;

    return { a: arrayGradiants, b }
}

export function update(a, b, gA, gB, lr) {

    let arrayA = a.map((w, i) => w - lr * gA[i]);
    let bTest = b - lr * gB;

    return { a: arrayA, b: bTest }

}

export function training(a, x, b, yWish, lr, epoque = 50) {
    let aTraining = [... a];
    let bTraining = b;
    let mse = [];

    for (let i = 0; i < epoque; i++) {
        // prediction 
        let yPredict = x.map(xj => {
            return predict(aTraining, xj, bTraining);
        });

        let tabErreur = erreurs(yWish, yPredict);

        mse.push(MSE(yWish, yPredict));

        let gradiants = gradiant(tabErreur, x, aTraining.length);

        let updateW = update(aTraining, bTraining, gradiants.a, gradiants.b, lr);

        aTraining.length = 0;

        aTraining = [... updateW.a];
        bTraining = updateW.b;
    }

    return { a: aTraining, b: bTraining, mse } 

}

