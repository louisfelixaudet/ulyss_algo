// calcule du score de lengagement
// import params
import * as params from "../../param/paramRegressionLogistique/paramEngagement";
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
*/

const engagementQuizz = (nbQuizzRepondu, nbQuizzMontrer) => (nbQuizzRepondu / nbQuizzMontrer) * 100;

/* 
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

export default function engagement(like, view, comPos, comNeg, partage, engagementQuizz, age) {
    return (like * params.COEFLIKE +

    view * params.COEFVIEW + 

    (comPos * params.COEFCOMPOS + comNeg * params.COEFCOMNEG) +

    partage * params.COEFPARTAGE + 

    engagementQuizz * params.COEFQUIZZ ) / age * params.COEFAGE;
}