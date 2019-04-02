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
const getVertical = data => data.filter( picture => picture.type === "V")
const getHorizont = data => data.filter( picture => picture.type === "H")

const linearPresentationHV = data =>
  getVertical(data).length % 2 === 0 ?
    getHorizont(data).concat(getVertical(data)) :                                     // Si vertical pair : pas de probleme
    getHorizont(data).concat(getVertical(data).splice(0, getVertical(data).length-1)) // Si vertical impaire on vire le dernier vertical


const presentationFromData = (data, presentationName = "presentation") => {
  fs.writeFileSync(`${presentationName}.txt`, "", err => err ? console.error(err) : console.log("Clear successfull")) // Clear last file

  // vignette vert = [1, 2] / if 2 append et vider
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



// let data = getFile("a_example.txt")
let data = getFile("c_memorable_moments.txt")
let dataV = getVertical(data)
let dataH = getHorizont(data)
let data3 = getNPicture(data, 0.49)
let linear = linearPresentationHV(data)
presentationFromData(linear)

console.log(data[0])
console.log(data[5])
