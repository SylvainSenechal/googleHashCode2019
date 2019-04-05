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
  fs.writeFileSync(`${presentationName}.txt`, compactVerticalVignette(data).length + "\n", err => err ? console.error(err) : console.log("append successfull")) // longueur de la solution

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

// TODO: remove if pour ternaire
const compactVerticalVignette = presentation => {
  return presentation.reduce( (acc, vignette) => {
    if (vignette.type === "H") { // vignette horizontale
      acc.result.push(vignette.features)
    }
    else if (vignette.type === "V" && !acc.vertical){ // premiere vignette verticale
      acc.result.push(vignette.features)
      acc.vertical = true
    }
    else { // seconde vignette verticale qu on compacte
      acc.result[acc.result.length-1] = [...new Set([...acc.result[acc.result.length-1], ...vignette.features])]
      acc.vertical = false
    }
    return acc
  }, {vertical: false, result: []}).result
}

const transitionQuality = (slide1, slide2) => {
  let intersection = slide1.filter(x => slide2.includes(x)).length
  let diff1 = slide1.filter(x => !slide2.includes(x)).length
  let diff2 = slide2.filter(x => !slide1.includes(x)).length
  return Math.min(intersection, Math.min(diff1, diff2))
}
const scorePresentation = presentation => {
  return presentation.reduce( (acc, features) => {
    return {score: acc.score + transitionQuality(features, acc.lastFeatures), lastFeatures: features}
  }, {score: 0, lastFeatures: []}).score
}

const gloutonnePresentation = data => {
  let result = [data.shift()]
  while (data.length > 0) {
    if (result[result.length-1].type === "H"){ // pas besoin de check H V, juste prendre soit 1 h soit 2 v

    }
    else { // chercher double v, faire attention si y a nb impaire de v a la fin

    }
    console.log(result[result.length-1])
    data.shift()
  }
}

let start = new Date()
// DATA :
// let data = getFile("a_example.txt")
let data = getFile("c_memorable_moments.txt")
// let data = getFile("b_lovely_landscapes.txt")
// let data = getFile("d_pet_pictures.txt")
// let data = getFile("e_shiny_selfies.txt")

let dataV = getVertical(data)
let dataH = getHorizont(data)
let dataPercent = getNPicture(data, 0.01)

// Linear basic presentation
let linear = linearPresentationHV(dataPercent)
// // writePresentation(linear)
let linearCompact = compactVerticalVignette(linear)
console.log(scorePresentation(linearCompact))

// gloutonnePresentation :
// let gloutonne = gloutonnePresentation(data)

console.log(new Date() - start, "ms runtime")
