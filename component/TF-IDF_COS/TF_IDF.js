
import * as data from '../../param/paramTF_IDF_COS/paramTFIDF.js';
/*
    Algo TF-IDF
    + COS

    DATA:
    text1
    text2

    !!! fonction1: cleanText !!!

    param: ruff text

    sortie: text nettoyé

    !!! fonction2: calculer TF !!!

    param: text1

    sortie: dictionnary of tf for each word of the text

    !!! function3: IDF !!!

    preFunction: check NB document avec a THIS word 

    param: nbDoc, preFunction

    sortie: score IDF
*/

function cleanText(text) {
    return text.replace(/['’]/g, ' ')
        .replace(/[^\p{L}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

const count = (text, word) => text.filter(item => item === word).length;

function calculerTF(text) {
    let tabWord = text.splite(" ");

    tabWord.forEach(element => {
        if ( element.length > 1 && ! element in tabWord) {
            let tf = count(tabWord, element) / tabWord.length;
            data.dictWord.set(element, [tf]);
        }
    });
}


function calculerIDF(nbDoc, docthisword){
    
}

