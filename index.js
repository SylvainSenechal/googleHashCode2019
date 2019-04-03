'use strict';

const fs = require("fs");
const path = require("path");

const getFile = name => {
  return fs.readFileSync(path.join(__dirname, 'database/' + name), 'utf-8')
    .split(/\r?\n/) // Separation des lignes
    .filter(line => line.length > 10) // On vire les lignes qui ne sont pas assez longues pour etre des vignette (ligne 1 et derniere typiquement)
    .map( (line, index) => ({
      type: line.split(' ')[0],
      nbFeatures: line.split(' ')[1],
      features: line.split(' ').slice(2),
      order: index
    }))
}
// TODO: voir si il faut math.floor percent
const getNPicture = (data, percent) => data.slice(0, data.length*percent)
// TODO: tester spread operator sur data voir si en modifiant data de base le result de filter est aussi modifie
const getVertical = data => data.filter( picture => picture.type === "V")
const getHorizont = data => data.filter( picture => picture.type === "H")

const linearPresentationHV = data =>
  getVertical(data).length % 2 === 0 ?
    [...getHorizont(data), ...getVertical(data)] :                                     // Si vertical pair : pas de probleme
    [...getHorizont(data), ...getVertical(data).splice(0, getVertical(data).length-1)] // Si vertical impaire on vire le dernier vertical


const writePresentation = (data, presentationName = "presentation") => {
  fs.writeFileSync(`${presentationName}.txt`, "", err => err ? console.error(err) : console.log("Clear successfull")) // Clear last file

  // TODO: ne pas utiliser un tableau puisque une seule valeur max stockee dedans
  // TODO: utiliser template literals pour concatenation des orders vignettes
  let nextVignette = []
  data.forEach( vignette => {
    // Soit on a une vignette horizontale et on l ecrit dans le fichier simplement
    if (vignette.type === "H") fs.appendFileSync(`${presentationName}.txt`, vignette.order + "\n", err => err ? console.error(err) : console.log("append successfull"))
    // Soit on a une double vignette verticale, il faut gerer un stockage si on est sur la premiere, ou si on est sur la deuxieme l ecriture + vider le stockage
    else {
      if (nextVignette.length === 0) nextVignette.push(vignette.order)
      else {
        fs.appendFileSync(`${presentationName}.txt`, nextVignette[0] + " " + vignette.order + "\n", err => err ? console.error(err) : console.log("append successfull"))
        nextVignette = []
      }
    }
  })
}

const compactVerticalVignette = presentation => {
  return presentation.reduce( (acc, vignette) => {
    if (vignette.type === "H") return {vertical: false, result: [...acc.result, vignette.features]}
    else if (vignette.type === "V" && !acc.vertical){
      return {vertical: true, result: [...acc.result, vignette.features]}
    }
    else if (vignette.type === "V" && acc.vertical) {

      // console.log( [...new Set([...acc.result[acc.result.length-1], ...vignette.features])] )

      acc.result[acc.result.length-1] = [...new Set([...acc.result[acc.result.length-1], ...vignette.features])]
      return {vertical: false, result: acc.result}
    }

    // return acc.vertical ?
    // {vertical: acc.vertical, result: [...acc.result, vignette.features]} :
    // {vertical: acc.vertical, result: [...acc.result, vignette.features]}
  }, {vertical: false, result: []})
}


const evaluatePresentation = data => {
}


let data = getFile("a_example.txt")
// let data = getFile("c_memorable_moments.txt")
let dataV = getVertical(data)
let dataH = getHorizont(data)
let data3 = getNPicture(data, 0.49)
let linear = linearPresentationHV(data)
// console.log(linear)
writePresentation(linear)
evaluatePresentation(linear)


let res = compactVerticalVignette(linear).result
console.log(res)
// let arr1 = [1,2,3,4,5];
// let arr2 = [3,4,5,6];
// let result = [...new Set([...arr1, ...arr2])];


// presentation.reduce( (acc, vignette) => {
//   {vertical: acc.vertical, result: [...acc.result, vignette.features]},
//   {vertical: false, result: []})
// }
