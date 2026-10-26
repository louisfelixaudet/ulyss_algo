import * as data from "#param/paramTF_IDF_COS/paramTFIDF.js";
import * as vecter from "#word2vecter";
import * as tfidf from "#tfidf";
/*
    algorithme pour trouver la sous categorie dune video: Embeding Systeme
    
    Data Vocabulaire:
    Description,
    Titre,
    Titre Quizz,
    Question Quizz,

    lists de fonction:
    !!! combiner texte !!!
    param: list:    Description,
                    Titre,
                    Titre Quizz,
                    Question Quizz,
    
    sortie: une longue string

    !!!  !!!

    etapes a faire 
    Étape 8, le vecteur d’une vidéo. C’est la moyenne des vecteurs de ses mots-clés, pondérée par leur poids TF-IDF.
    Ici j’ai pris idf = ln(4 / nombre de vidéos qui contiennent le mot), avec tf = 1 : 1.386 pour un mot présent dans une seule vidéo,
    0.693 pour un mot présent dans deux. Pour A :

    x = (1.386×0.263 + 0.693×1.866 + 1.386×0.845 + 0.693×6.483 + 0.693×1.019) / 4.851 = 1.655

    et de même y = −1.613. Donc A = [1.655, −1.613]. Même calcul pour B, C et D.

    Étape 9, recommander. Un utilisateur a aimé A, donc son profil est A. On calcule le cosinus entre ce profil et chaque vidéo candidate :

*/


export function combineText(...param) {
    let string = "";
    param.forEach(text => {
        string += " " + (text ?? "");
    });
    return string;
}

export function supprimerLittleWord(stringData, tabTFIDFscore) {
    let stringTab = stringData.split(" ");

    let tabClean = stringTab.filter(word => (tabTFIDFscore[word] ?? Infinity) >= data.scoreMiniTFIDF);

    return tabClean.join(" ");
}

// format data in json { desc, title, titleQuizz, questQizz }
export function newDataCat(data, tabTFIDF) {

    let newData = [];
    data.forEach(doc => {
        let text = combineText(doc.desc, doc.title, doc.titleQuizz, doc.questQuizz);
        newData.push(supprimerLittleWord(text, tabTFIDF));
    });

    return newData;

}


export function vecterTab(dataImp) {
    let { mots, index } = vecter.makeDict(dataImp);
    let paires = vecter.createPaires(mots, index);
    let tabsVect = vecter.createTab(mots);
    let { W1, W2 } = vecter.training(tabsVect.W1, tabsVect.W2, paires);
    return {W1, index};
}

// je prend chaque mot dune video et je fais une moyenne de chaque video 
export function getVideoContext(dataImp, W1, index) {
    let contextVideo = [];

    dataImp.forEach(text => {

        let vecterVideo = [];

        W1[0].forEach(dim => {
            vecterVideo.push(0);
        });

        text.split(" ").forEach(word => {
            if(index.has(word)){
                vecterVideo = vecter.add(vecterVideo, W1[index.get(word)]);
            }
        });

        vecterVideo = vecter.scale(vecterVideo, (1 / text.split(" ").length));
        contextVideo.push(vecterVideo);

    });

    return contextVideo;

}

export const cosinus = (a, b) => vecter.dot(a, b) / (Math.sqrt(vecter.dot(a, a)) * Math.sqrt(vecter.dot(b, b)) || 1); 

export function creatProfil(videosAimer){

    // si aucune video aimer renvoyer un vecteur vide
    if(videosAimer.length === 0) return [];

    let vecterUser = [];

    videosAimer[0].forEach(dim => {
            vecterUser.push(0);
    });

    videosAimer.forEach(videoVect => {
        vecterUser = vecter.add(vecterUser, videoVect);
    });

    return vecter.scale(vecterUser, (1 / videosAimer.length));

}

// all vecteur video - video watched = vecteur video unwatch
export const deleteWatched = (videoWatch, videoVecteur) => {
    const watchedSet = new Set(videoWatch);
    return videoVecteur.filter((video) => !watchedSet.has(video.id));
};

export function COSWithStudent(studentSubectVect, SubjectsVector) {
    let tabCOS = [];

    if(studentSubectVect.length === 0) return SubjectsVector;

    SubjectsVector.forEach(vector => {
        tabCOS.push(vecter.sigmoid(cosinus(studentSubectVect, vector)));
    });

    return tabCOS;
}