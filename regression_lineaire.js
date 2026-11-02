import * as reg from '#regressionLineaire';
import * as con from '#connaissance';
import * as eng from '#engagement';
import * as sousCat from '#sousCategorie';


/*
    Ici je prend les datas de chaque categorie jentraine leur modele et je retourne une valeur pour chaquun dans la regression lineaire

    * = deja fait dans leur module respectif a faire sur le serveur

    - * get Data : {
        lenght: "had the same number of video for every subject"
        wait: "new video will be in the data base but inline to be add in the noSQL"
    }
    - * training : {
        teach : "train each axes with there data",
    }
    - * data Structure : {
        array: "each axes need the same lenght",
        data: each data in the array as to be between 0 and 1 
    }
    - training lineaire regression : {
        training on data: "take the data of each axe and train the modale"
    }
    - predict lineaire regression : {
        find : "wich video is closer to the Y axe with the need of the student"
    }

*/
