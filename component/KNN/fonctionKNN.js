import { dot } from "#word2vecter";

// fonction
// token message
export function tokenisation(message) {
  return message.toLowerCase().split(/\s+/).filter(Boolean);
}

// vectorisation
export function vectorisation(message, vocabulaire) {
  const tokens = tokenisation(message);
  const vecteur = [];
  for (const word of vocabulaire) {
    vecteur.push(tokens.filter((t) => t === word).length);
  }
  return vecteur;
}

export const cosinus = (a, b) => dot(a, b) / (Math.sqrt(dot(a, a)) * Math.sqrt(dot(b, b)) || 1);

// calculer distance
function distance(v1, v2) {
  let somme = 0;
  for (let i = 0; i < v1.length; i++) {
    somme += (v1[i] - v2[i]) ** 2;
  }
  return Math.sqrt(somme);
}


// trie comme les tuples Python : d'abord la distance, ensuite le texte
function comparerTuples(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
}

// équivalent de Counter(labels).most_common(1)[0][0]
function plusFrequent(labels) {
  const compteur = new Map();
  for (const label of labels) {
    compteur.set(label, (compteur.get(label) || 0) + 1);
  }
  let meilleur = null;
  let max = 0;
  for (const [label, nb] of compteur) {
    if (nb > max) {
      max = nb;
      meilleur = label;
    }
  }
  return meilleur;
}

// prediction
export default function knnPrediction(message, data, k, indice = 0) {

  const dossier = [];
  
  for (const ligne of data) {
    for (const word of tokenisation(ligne[indice])) {
      dossier.push(word);
    }
  }
  
  const vocabulaire = [...new Set(dossier)].sort();
  
  const vecteurM = vectorisation(message, vocabulaire);
  const listeDU = [];
  const listephrase = [];

  for (const ligne of data) {
    const vecteurMD = vectorisation(ligne[indice], vocabulaire);
    // 1 - cosinus: 0 = identiques, le tri croissant garde les plus proches
    const distanceEntreVmdEtVm = 1 - cosinus(vecteurM, vecteurMD);
    listephrase.push([distanceEntreVmdEtVm, ligne[indice]]);
    listeDU.push([distanceEntreVmdEtVm, ligne[indice + 1]]);
  }

  listeDU.sort(comparerTuples);
  listephrase.sort(comparerTuples);

  const top = listeDU.slice(0, k);
  console.log(listephrase.slice(0, k));
  console.log(top);
  const labels = top.map(([, label]) => label);

  return plusFrequent(labels);
}
