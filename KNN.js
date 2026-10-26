import knnPrediction from "./component/KNN/fonctionKNN.js";

// data: [commentaire, label]
const data = [
  ["super video merci beaucoup", 1],
  ["tres bien explique j ai tout compris", 1],
  ["excellent contenu continue comme ca", 1],
  ["j adore cette chaine", 1],
  ["bravo c est clair et utile", 1],
  ["merci cette explication est parfaite", 1],
  ["genial j ai enfin compris", 1],
  ["video tres interessante", 1],
  ["nul je n ai rien compris", 0],
  ["tout est faux dans cette video", 0],
  ["perte de temps explication confuse", 0],
  ["tres mauvais contenu", 0],
  ["c est faux et mal explique", 0],
  ["je deteste cette chaine", 0],
  ["video ennuyeuse et inutile", 0],
  ["arretez de dire n importe quoi", 0],
];

let message = "tout est faux!!!";
console.log(knnPrediction(message, data, 3));
