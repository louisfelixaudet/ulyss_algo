import * as neuron from "#neurone";
// connaissance Score

/*

    ce document doit faire deux choses:

    1. retourner une liste de niveau de connaissance pour chaque video

    2. appliquer une nouvelle ronde dentrainement: seulement appeler depuis neurone

*/


export function resultatsNeurone(w, b, videos){
    let answerArray = [];
    videos.forEach(video => {
        answerArray.push(neuron.neuron(
            [
                video.difTeacher, 
                video.difTeacherOpinion, 
                video.tauxReussiteQuizz,
                video.videoSimResalt
            ],
            w,
            b
        ));
    });

    return answerArray;
}