
import * as data from '../../param/paramTF_IDF_COS/paramTFIDF.js';
/*
    Algo TF-IDF
    + COS

    DATA:
    text1
    textStack

    Data structure:

    {
        "word": [TF, IDF, TF-IDF],
    }

    et

    {
        "word1": [doc1, doc2, doc3],
        "word2": [doc1, doc2, doc3],
        "word3": [doc1, doc2, doc3]
    }

    !!! fonction1: cleanText !!!

    param: ruff text

    sortie: text nettoyé

    !!! fonction2: TF !!!

    param: text1

    sortie: dictionnary of tf for each word of the text

    !!! function3: IDF !!!

    preFunction: check NB document avec a THIS word 

    param: nbDoc, preFunction

    sortie: Map score IDF


*/

function cleanText(text) {
    return text;
    return text.replace(/['’]/g, ' ')
        .replace(/[^\p{L}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

const count = (text, word) => text.filter(item => item === word).length;

function TF(text) {
    let tabWord = text.split(" ");
    let dictTF = {};

    tabWord.forEach(element => {

        if (element.length > 1 && !(element in tabWord)) {

            let tf = count(tabWord, element) / tabWord.length;
            dictTF[element] = tf;

        }

    });

    return dictTF;
}

function df(t, allDoc) {
    let countWord = 0;
    allDoc.forEach(doc => {
        if (t in doc) { countWord++; }
    });
    return countWord;
}

function IDF() {

    data.dictWordTF.forEach(doc => {

        Object.keys(doc).forEach(word => {

                data.dictWordIDF[word] = Math.log10(data.dictWordTF.length / df(word, data.dictWordTF));

        });

    });

}


export default function TF_IDF(text) {

    // rajouter le texte aux data TF
    data.dictWordTF.push(TF(cleanText(text)));

    IDF();

    // la matrice est reconstruite a chaque appel a partir de tous les documents
    let TF_IDFmatrice = {};

    data.dictWordTF.forEach(doc => {
        Object.keys(doc).forEach(word => {
            if (!(word in TF_IDFmatrice)) {
                TF_IDFmatrice[word] = [];
            }
        });
    });

    data.dictWordTF.forEach(doc => {

        Object.keys(TF_IDFmatrice).forEach(wordTF_IDF => {

            if (!(wordTF_IDF in doc)) {

                TF_IDFmatrice[wordTF_IDF].push(0);

            } else {

                TF_IDFmatrice[wordTF_IDF].push(data.dictWordIDF[wordTF_IDF] * doc[wordTF_IDF]);

            }

        });

    });

    return TF_IDFmatrice;

}



/* ==================== TESTS ==================== */

function resetData() {
    data.dictWordTF.length = 0;
    Object.keys(data.dictWordIDF).forEach(k => delete data.dictWordIDF[k]);
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const tests = {
    "1. dictionnaire TF-IDF : matrice vide": () => {
        const res = TF_IDF("le chat mange le poisson");
        assert(res && typeof res === "object", "la matrice doit etre un objet");
        assert(Object.keys(res).length > 0, "la matrice vide doit etre remplie de mots");
    },

    "2. dictionnaire TF-IDF : matrice pleine": () => {
        TF_IDF("le chat dort");
        TF_IDF("le chien dort");
        const res = TF_IDF("le chat mange le poisson");
        assert(Object.keys(res).length >= 3, "les mots existants doivent rester dans la matrice");
        Object.keys(res).forEach(w => assert(Array.isArray(res[w]), `la ligne "${w}" doit etre un tableau`));
    },

    "3. TF : map vide": () => {
        const res = TF("");
        assert(Object.keys(res).length === 0, "un texte vide doit donner un dictionnaire TF vide");
    },

    "4. TF : map pleine": () => {
        const res = TF("chat chien chat poisson");
        assert(Math.abs(res["chat"] - 2 / 4) < 1e-9, "TF(chat) doit valoir 0.5");
        assert(Math.abs(res["chien"] - 1 / 4) < 1e-9, "TF(chien) doit valoir 0.25");
        assert(Math.abs(res["poisson"] - 1 / 4) < 1e-9, "TF(poisson) doit valoir 0.25");
    },

    "5. peu de data (2 documents)": () => {
        let matrice = {};
        ["le chat dort", "le chien dort"].forEach(t => { matrice = TF_IDF(t); });
        assert(data.dictWordTF.length === 2, "2 documents doivent etre enregistres");
        assert("chat" in matrice && "chien" in matrice, "chat et chien doivent etre dans la matrice");
    },

    "6. data moyenne (20 documents)": () => {
        let matrice = {};
        for (let i = 0; i < 20; i++) matrice = TF_IDF(`document numero mot${i} commun texte`);
        assert(data.dictWordTF.length === 20, "20 documents doivent etre enregistres");
        assert("mot19" in matrice, "mot19 doit etre dans la matrice");
        assert(matrice["mot0"].length === 20, `chaque ligne doit avoir 20 colonnes ${matrice["mot0"].length}, ${matrice["mot15"].length}`);
    },

    "7. beaucoup de data (1000 documents)": () => {
        let matrice = {};
        for (let i = 0; i < 1000; i++) matrice = TF_IDF(`document numero mot${i % 50} commun texte${i}`);
        assert(data.dictWordTF.length === 1000, "1000 documents doivent etre enregistres");
        assert(Object.keys(matrice).length >= 50, "la matrice doit contenir au moins 50 mots");
    },

    "8. valeur TF-IDF exacte (calculee a la main)": () => {
        TF_IDF("chat dort");
        const m = TF_IDF("chien dort");
        // N = 2 ; chat : tf = 1/2, df = 1 -> idf = log(2) ; dort : df = 2 -> idf = 0
        assert(Math.abs(m["chat"][0] - 0.5 * Math.log10(2)) < 1e-9, `chat doc1 doit valoir ${0.5 * Math.log(2)}, recu ${m["chat"][0]}`);
        assert(m["chat"][1] === 0, "chat est absent du doc2, doit valoir 0");
        assert(Math.abs(m["chien"][1] - 0.5 * Math.log10(2)) < 1e-9, `chien doc2 doit valoir ${0.5 * Math.log(2)}, recu ${m["chien"][1]}`);
    },

    "9. mot present dans tous les documents -> score 0": () => {
        TF_IDF("le chat dort");
        TF_IDF("le chien dort");
        const m = TF_IDF("le poisson dort");
        // "dort" est dans les 3 documents : idf = log(3/3) = 0
        m["dort"].forEach((v, i) => assert(v === 0, `dort doc${i + 1} doit valoir 0, recu ${v}`));
    },

    "10. IDF recalcule quand le nombre de documents augmente": () => {
        TF_IDF("chat dort");
        TF_IDF("chien dort");
        TF_IDF("poisson nage");
        // chat est dans 1 doc sur 3 : idf = log(3), pas l'ancienne valeur calculee avec N = 1
        assert(Math.abs(data.dictWordIDF["chat"] - Math.log10(3)) < 1e-9, `IDF(chat) doit valoir ${Math.log(3)}, recu ${data.dictWordIDF["chat"]}`);
        assert(Math.abs(data.dictWordIDF["dort"] - Math.log10(3 / 2)) < 1e-9, `IDF(dort) doit valoir ${Math.log(3 / 2)}, recu ${data.dictWordIDF["dort"]}`);
    },
};

export function runTests() {
    let passed = 0;
    Object.entries(tests).forEach(([name, fn]) => {
        resetData();
        try {
            fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (e) {
            console.log(`❌ ${name} -> ${e.message}`);
        }
    });
    console.log(`\n${passed}/${Object.keys(tests).length} tests reussis`);
}

// Lance les tests seulement si le fichier est execute directement : node TF_IDF.js
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
    runTests();
}
