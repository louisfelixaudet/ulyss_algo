import { knnPrediction as knn } from "./component/KNN/fonctionKNN.js";
// cree un vocabulaire
const dossier = [];

for (const ligne of data) {
  for (const word of knn.tokenisation(ligne[0])) {
    dossier.push(word);
  }
}

const vocabulaire = [...new Set(dossier)].sort();

//console.log(vocabulaire);
//console.log(vectorisation(data[2][0], vocabulaire));
//console.log(tokenisation(data[2][0]));
let message = "tout est faux!!!";
console.log(knn.knnPrediction(vocabulaire, message, data, 3));
