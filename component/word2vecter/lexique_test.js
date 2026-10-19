/*
    Lexique de test pour word2vecter
    Phrases generees de facon deterministe (PRNG avec graine) a partir de gabarits par theme.
    Format: tableau de phrases en minuscules, sans ponctuation, mots separes par un espace.
*/

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const THEMES = {
    animaux: {
        sujets: ["le chat", "le chien", "le cheval", "la vache", "le lapin", "l oiseau", "le poisson", "la souris"],
        verbes: ["mange", "regarde", "poursuit", "cherche", "attrape", "observe"],
        complements: ["dans le jardin", "pres de la ferme", "sous la table", "dans la foret", "pres de la riviere", "dans le champ"],
        extras: ["avec son petit", "pendant la nuit", "avec beaucoup de patience", "sans faire de bruit"]
    },
    cuisine: {
        sujets: ["le cuisinier", "ma mere", "le chef", "mon pere", "la boulangere", "le patissier", "ma soeur", "le voisin"],
        verbes: ["prepare", "cuit", "coupe", "melange", "sale", "goute"],
        complements: ["la soupe chaude", "le gateau au chocolat", "le pain frais", "la sauce tomate", "le poulet roti", "la tarte aux pommes"],
        extras: ["dans la cuisine", "avec du beurre", "pour le diner", "avec un peu de sel"]
    },
    sport: {
        sujets: ["le joueur", "l equipe", "le gardien", "l entraineur", "la coureuse", "le nageur", "le capitaine", "l arbitre"],
        verbes: ["marque", "court", "tire", "gagne", "perd", "saute"],
        complements: ["sur le terrain", "pendant le match", "dans le stade", "devant la foule", "a la derniere minute", "pendant la course"],
        extras: ["avec beaucoup d energie", "apres l entrainement", "pour la victoire", "sous la pluie"]
    },
    technologie: {
        sujets: ["le programmeur", "l ingenieur", "le serveur", "l application", "le developpeur", "le reseau", "le robot", "l algorithme"],
        verbes: ["ecrit", "analyse", "compile", "teste", "installe", "corrige"],
        complements: ["le code source", "la base de donnees", "le programme", "le modele", "l interface", "le logiciel"],
        extras: ["sur l ordinateur", "avant la livraison", "avec un nouveau langage", "pendant la nuit"]
    },
    nature: {
        sujets: ["le soleil", "la lune", "le vent", "la pluie", "la montagne", "la riviere", "l arbre", "la neige"],
        verbes: ["eclaire", "traverse", "couvre", "baigne", "reveille", "entoure"],
        complements: ["la vallee", "la foret", "le lac", "le village", "la plaine", "la colline"],
        extras: ["au printemps", "pendant l hiver", "au lever du jour", "en automne"]
    },
    ville: {
        sujets: ["le maire", "le conducteur", "le passant", "le marchand", "le policier", "le touriste", "l habitant", "le livreur"],
        verbes: ["traverse", "visite", "conduit", "ouvre", "ferme", "nettoie"],
        complements: ["la grande rue", "le vieux pont", "la place centrale", "le marche", "la gare", "le musee"],
        extras: ["tres tot le matin", "avec une carte", "pendant la fete", "dans le centre ville"]
    },
    ecole: {
        sujets: ["le professeur", "l eleve", "le directeur", "l etudiante", "le bibliothecaire", "la classe", "le stagiaire", "le chercheur"],
        verbes: ["lit", "explique", "apprend", "ecrit", "revise", "corrige"],
        complements: ["la lecon", "le livre", "l examen", "le devoir", "le cours de maths", "l exercice"],
        extras: ["dans la salle de classe", "avant la sonnerie", "avec attention", "pour la rentree"]
    },
    voyage: {
        sujets: ["le pilote", "la voyageuse", "le capitaine", "le guide", "le train", "l avion", "le bateau", "le chauffeur"],
        verbes: ["quitte", "atteint", "reserve", "decouvre", "longe", "survole"],
        complements: ["la cote", "l aeroport", "le port", "la frontiere", "l hotel", "la capitale"],
        extras: ["pendant les vacances", "avec une valise", "sous un ciel bleu", "apres un long trajet"]
    }
};

// phrases fixes ajoutees pour couvrir des structures sans gabarit (courtes, negatives, questions)
const PHRASES_FIXES = [
    "le chat dort sur le canape",
    "le chien dort sur le tapis",
    "le chef goute la soupe",
    "le joueur court sur le terrain",
    "le programmeur teste le code",
    "la lune brille sur la montagne",
    "le train quitte la gare",
    "le professeur lit le livre",
    "le chat ne mange pas la soupe",
    "le chien ne court pas dans le stade",
    "est ce que le chat mange la souris",
    "est ce que le joueur gagne le match"
];

function genererLexique(nbParTheme = 60, graine = 42) {
    const rand = mulberry32(graine);
    const pick = arr => arr[Math.floor(rand() * arr.length)];
    const phrases = [];

    Object.keys(THEMES).forEach(nom => {
        const t = THEMES[nom];
        for (let i = 0; i < nbParTheme; i++) {
            const base = `${pick(t.sujets)} ${pick(t.verbes)} ${pick(t.complements)}`;
            // une phrase sur deux recoit un complement supplementaire
            phrases.push(rand() < 0.5 ? `${base} ${pick(t.extras)}` : base);
        }
    });

    PHRASES_FIXES.forEach(p => phrases.push(p));
    return phrases;
}

// retourne les mots uniques d un theme (utile pour les tests de couverture)
function motsDuTheme(nom) {
    const t = THEMES[nom];
    const mots = new Set();
    [...t.sujets, ...t.verbes, ...t.complements, ...t.extras].forEach(p => p.split(" ").forEach(m => mots.add(m)));
    return mots;
}

export { genererLexique, motsDuTheme, THEMES, PHRASES_FIXES };
