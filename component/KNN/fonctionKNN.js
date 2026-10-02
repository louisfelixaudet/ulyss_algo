// fonction
// token message
function tokenisation(message) {
  return message.toLowerCase().split(/\s+/).filter(Boolean);
}

// vectorisation
function vectorisation(message, vocabulaire) {
  const tokens = tokenisation(message);
  const vecteur = [];
  for (const word of vocabulaire) {
    vecteur.push(tokens.filter((t) => t === word).length);
  }
  return vecteur;
}

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
export default function knnPrediction(vocabulaire, message, data, k) {
  const vecteurM = vectorisation(message, vocabulaire);
  const listeDU = [];
  const listephrase = [];

  for (const ligne of data) {
    const vecteurMD = vectorisation(ligne[0], vocabulaire);
    const distanceEntreVmdEtVm = distance(vecteurM, vecteurMD);
    listephrase.push([distanceEntreVmdEtVm, ligne[0]]);
    listeDU.push([distanceEntreVmdEtVm, ligne[1]]);
  }

  listeDU.sort(comparerTuples);
  listephrase.sort(comparerTuples);

  const top = listeDU.slice(0, k);
  console.log(listephrase.slice(0, k));
  console.log(top);
  const labels = top.map(([, label]) => label);

  return plusFrequent(labels);
}
