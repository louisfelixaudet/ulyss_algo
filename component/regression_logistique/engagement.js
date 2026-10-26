// calcule du score de lengagement
// import params
import * as params from "#param/paramRegressionLogistique/paramEngagement.js";
import * as sig from "#word2vecter";
import knnPrediction from "#knn";

/*

    rajouter un bonus sur la nouveaute de la video puis la reduire a chaque jour

    DATA:
    Like,
    View,
    commentairePos,
    commentaireNeg,
    Partage,
    Nb quizz repondu,
    Nb quizz montrer,
    Age de la video

    COEFFICIANT:
    View,
    Like
    coefCommPos,
    coefCommPos,
    Partage,
    Age,
    Quizz valeur

    ALGO:

    engagement = (like * coefLike +

    view * coefView + 

    (commentairePos * coefCommPos + commentaireNeg * coefCommNeg) +

    partage * coefPartage + 

    pourcentage de quizz * coefQuizz ) 

    / age * coefAge;


*/


/*
    Fonction: calculer engagement quizz

    name: engagementQuizz

    param: nbQuizzRepondu, nbQuizzMontrer

    exemple: (34, 56) => 34 / 56 = 0,60


    Fonction: cacule engagement

    name: engagement

    param: like, view, com, partage, engagementQuizz, age

    coefficiant: coefView, coefLike, coefCommPos, coefCommNeg, coefPartage, coefAge

    exemple: 200 * 10 +

    3000 * 1 + 

    30 * 5 +

    60 * 2 + 

    0.45 ) / 5 * 2
    
    = 527.45;
*/ 

// calcule de categorie dun commentaire
// les resultat doivent etre 0 ou 1
export function nbComCat(commentairesVideo, allCom){
    let comPos = 0;
    let comNeg = 0;

    commentairesVideo.forEach(com => {
        let resultat = knnPrediction(com, allCom, 3);
        if(resultat === 0) comNeg++;
        if(resultat === 1) comPos++;
        else return false;
    }); 

    return { pos: comPos, neg: comNeg }
}

// calcule de lengagement

const engagementQuizz = (nbQuizzRepondu, nbQuizzMontrer) => (nbQuizzRepondu / nbQuizzMontrer) * 100;

export function engagement(like, view, comPos, comNeg, partage, nbQuizzRepondu, nbQuizzMontrer, age) {
    let score = (like * params.COEFLIKE +

    view * params.COEFVIEW + 

    (comPos * params.COEFCOMPOS + comNeg * params.COEFCOMNEG) +

    partage * params.COEFPARTAGE + 

    engagementQuizz(nbQuizzRepondu, nbQuizzMontrer) * params.COEFQUIZZ ) / age * params.COEFAGE;

    return score;
}

// lire une valeur et la mettre dans une borne valide pour une sigmoide
export const burnValue2Sigmoide = (score) => sig.sigmoid(Math.log(1 + Math.max(0, score)));

// creer une tab pour la value de chaque video
export function video2Engagement(allVideo, allCom){
    let engagements = [];

    allVideo.forEach(video => {
        let comType = nbComCat(video.com, allCom);
        let score = engagement(
            video.like,
            video.view,
            comType.pos,
            comType.neg,
            video.partage,
            video.quizz.repondu,
            video.quizz.show,
            video.age
        );
        engagements.push(burnValue2Sigmoide(score));
    });

    return engagements;
}

// training for commentaire
// [idVideo, commentaire, type]
export function sortCom(allCom){
    const UndefinedCom = allCom.filter((com) => com[2] === undefined);
    const definedCom = allCom.filter((com) => com[2] !== undefined);
    let newCom = [];

    UndefinedCom.forEach(com => {
        newCom.push([com[0], com[1], knnPrediction(com[1], definedCom, 3, 1)]);
    });

    return newCom;
}