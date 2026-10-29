/*
    algo regression lineaire  
*/

// prediction sur 3 x
export const predict = (a, x, b) => x.reduce((y, xi, i) => {
   return y + xi * a[i]
}, b)


//calculer erreur
export function MSE(yWish, a, x, b){
    
}