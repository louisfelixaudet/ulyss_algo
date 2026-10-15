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


function combineText(...param) {
    string = "";
    param.forEach(text => {
        string += text;
    });
}

