'use strict"';

const fs = require("fs");
const path = require("path");

const getFile = name => {
  return fs.readFileSync(path.join(__dirname, 'database/' + name), 'utf-8')
    .split(/\r?\n/) // Separation des lignes
    .filter(line => line.length > 10) // On vire les lignes qui ne sont pas assez longues pour etre des descriptors (ligne 1 typiquement)
    .map(line => ({
      type: line.split(' ')[0],
      nbFeatures: line.split(' ')[1],
      features: line.split(' ').slice(2),
      vignetteOrder: 0
    }))
}
// TODO: voir si il faut math.floor percent
const getNPictures = (data, percent) => data.slice(0, data.length*percent)
const dataVertical = data => data.filter( picture => picture.type === "V")
const dataHorizont = data => data.filter( picture => picture.type === "H")

// let data = getFile("a_example.txt")
let data = getFile("c_memorable_moments.txt")
let dataV = dataVertical(data)
let dataH = dataHorizont(data)
let data3 = getNPictures(data, 0.49)


const linearPresentationHV = data => dataVertical(data).concat(dataHorizont(data))

console.log(linearPresentationHV(data))
