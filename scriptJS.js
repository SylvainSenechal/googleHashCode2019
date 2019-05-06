'use strict';

const fs = require("fs");
const path = require("path");

///////////////////////////
// FONCTIONS UTILITAIRES //
///////////////////////////

const getFile = name => {
  return fs.readFileSync(path.join(__dirname, 'database/' + name), 'utf-8')
    .split(/\r?\n/) // Separation des lignes
    .filter(line => line.length > 5) // On vire les lignes qui ne sont pas assez longues pour etre des vignette (ligne 1 et derniere typiquement)
    .map( (line, index) => ({
      type: line.split(' ')[0],
      nbFeatures: line.split(' ')[1],
      features: line.split(' ').slice(2),
      order: index
    }))
}

const getNPicture = (data, percent) => data.slice(0, data.length*percent/100)
const getVertical = data => data.filter( picture => picture.type === "V")
const getHorizont = data => data.filter( picture => picture.type === "H")

const linearPresentationHV = data =>
  getVertical(data).length % 2 === 0 ?
    [...getHorizont(data), ...getVertical(data)] :                                     // Si vertical pair : pas de probleme
    [...getHorizont(data), ...getVertical(data).splice(0, getVertical(data).length-1)] // Si vertical impaire on vire le dernier vertical


const writePresentation = (data, presentationName = "presentation") => {
  fs.writeFileSync(`${presentationName}.sol`, "", err => err ? console.error(err) : console.log("Clear successfull")) // Clear last file
  fs.writeFileSync(`${presentationName}.sol`, compactVerticalVignette(data).length + "\n", err => err ? console.error(err) : console.log("append successfull")) // longueur de la solution

  let nextVignette = []
  data.forEach( vignette => {
    // Soit on a une vignette horizontale et on l ecrit dans le fichier simplement
    if (vignette.type === "H") fs.appendFileSync(`${presentationName}.sol`, vignette.order + "\n", err => err ? console.error(err) : console.log("append successfull"))
    // Soit on a une double vignette verticale, il faut gerer un stockage si on est sur la premiere, ou si on est sur la deuxieme l ecriture + vider le stockage
    else {
      if (nextVignette.length === 0) nextVignette.push(vignette.order)
      else {
        fs.appendFileSync(`${presentationName}.sol`, nextVignette[0] + " " + vignette.order + "\n", err => err ? console.error(err) : console.log("append successfull"))
        nextVignette = []
      }
    }
  })
}

// Compacte les vignettes verticales pour calculer le score ensuite plus facilement
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
  // return diff1
}
const scorePresentation = presentation => {
  return presentation.reduce( (acc, features) => {
    return {score: acc.score + transitionQuality(features, acc.lastFeatures), lastFeatures: features}
  }, {score: 0, lastFeatures: []}).score
}

///////////////////////////////
// ALGORITHMES DE RESOLUTION //
///////////////////////////////

// PARTIE ALGORITHME GLOUTON
const gloutonnePresentation = (data, depth = 50) => {
  let presentation
  let arrayFeatures
  // On commence par inserer une premiere image horizontale, ou verticale si on n'a pas d'horizontale
  if (getHorizont(data).length > 0) {
    presentation = [getHorizont(data)[0]]
    arrayFeatures = [presentation[0].features]
    data = data.filter( e => e.order != presentation[0].order)
  }
  else {
    presentation = [getVertical(data)[0]]
    presentation.push(getVertical(data)[1])
    data = data.filter( e => e.order != presentation[0].order)
    data = data.filter( e => e.order != presentation[1].order)
    arrayFeatures = [[...new Set([...presentation[0].features, ...presentation[1].features])]]
  }
  // Tant qu'on peut inserer une image dans la presentation
  while (data.length > 0) {

    // On choisit la meilleur image (qui maximise la transition)
    let bestTransition = data.slice(0, depth).reduce( (acc, picture, index) => {
      if (transitionQuality(arrayFeatures[arrayFeatures.length-1], picture.features) > transitionQuality(arrayFeatures[arrayFeatures.length-1], acc.features)) {
        return picture
      }
      else {
        return acc
      }
    }, data[0])


    presentation.push(bestTransition)
    arrayFeatures.push(bestTransition.features)
    data = data.filter( e => e.order != bestTransition.order)

    // Si l'image qui maximise la transition est verticale, il faut sélectionner une deuxième verticale qui maximise aussi la transition
    if (presentation[presentation.length-1].type == "V") {
      if (getVertical(data).length == 0) {
        presentation.pop()
      }
      else {
        let bestTransition = getVertical(data).slice(0, depth).reduce( (acc, picture, index) => {
          if (transitionQuality(arrayFeatures[arrayFeatures.length-2], [...new Set([...arrayFeatures[arrayFeatures.length-1], ...picture.features])]) > transitionQuality(arrayFeatures[arrayFeatures.length-2], [...new Set([...arrayFeatures[arrayFeatures.length-1], ...acc.features])])) {
            return picture
          }
          else {
            return acc
          }
        }, getVertical(data)[0] )
        presentation.push(bestTransition)
        arrayFeatures[arrayFeatures.length-1] = [...new Set([...arrayFeatures[arrayFeatures.length-1], ...bestTransition.features])]

        data = data.filter( e => e.order != bestTransition.order)
      }
    }
  }
  return presentation
}

// PARTIE ALGORITHME CUSTOM
const algoCustomDatasetB = data => {
  let dataReference = [...data]
  console.log("length data ", data.length)
  let features = {} // Table de hashage des features
  data.forEach( image => {
    image.features.forEach( feature => {
      features[feature] = []
    })
  })
  data.forEach( image => { // On attribue a chaque feature les images qui les possèdent
    image.features.forEach( feature => {
      features[feature].push(image.order)
    })
  })

  // On insère la première image du dataset dans la présentation
  let presentation = [data[0]]
  presentation[0].features.forEach( feature => {
    features[feature] = features[feature].filter( e => e != presentation[0].order)
  })
  data = data.filter( e => e.order != presentation[0].order)

  // Tant qu'on peut rajouter une image a la presentation
  while (data.length > 0) {
    let possibleNextSlidesIndex = []
    let possibleNextSlides = []

    // on récupère les images avec au moins une feature en commun
    presentation[presentation.length-1].features.forEach (feature => {
      possibleNextSlidesIndex = [...new Set([...possibleNextSlides, ...features[feature]])]
    })
    possibleNextSlidesIndex.forEach( index => possibleNextSlides.push(dataReference[index]))

    // Si on a trouvé une image (ou des images) avec au moins une feature en commun,
    // On prend celle qui maximise la transition
    if (possibleNextSlides.length > 0) {
      let bestTransition = possibleNextSlides.reduce( (acc, picture) => {
        if (transitionQuality(presentation[presentation.length-1].features, picture.features) > transitionQuality(presentation[presentation.length-1].features, acc.features)) {
          return picture
        }
        else {
          return acc
        }
      }, possibleNextSlides[0])
      presentation.push(bestTransition)

      bestTransition.features.forEach( feature => {
        features[feature] = features[feature].filter( e => e != bestTransition.order)
      })

      data = data.filter( e => e.order != bestTransition.order)
    }
    // Sinon on ajouter simplement la prochaine image du dataset
    else {
      presentation.push(data[0])
      data[0].features.forEach( feature => {
        features[feature] = features[feature].filter( e => e != data[0].order)
      })
      data = data.filter( e => e.order != presentation[presentation.length-1].order)
    }
  }
  let presentationFeatures = []
  presentation.forEach( slide => presentationFeatures.push(slide.features))
  return presentationFeatures
}



// PARTIE VOISINAGE
// TODO: voisinage par echange de 2 verticales avec 2 verticales, 1 hori avec 1 hori, ou 1 vert avec 1 vert
const voisinage = dataPercent => {
  // On commence par creer une solution random, ou reprendre une solution de l'algo glouton
  let random = gloutonnePresentation(dataPercent, 500)
  console.log(scorePresentation(compactVerticalVignette(random)))
  // let random = linearPresentationHV(dataPercent)
  let data = [...dataPercent] // Deep copy

  // Code pour créer une solution random, mais l'idéal est de partir d'une solution gloutonne
  // let random = []
  // while(data.length > 0) {
  //   let id = Math.floor(Math.random() * data.length)
  //   random.push(data[id]) // Ajout d'une vignette random
  //   data.splice(id, 1)
  //
  //   if (random[random.length -1].type == "V") { // Si la vignette random ajoutee est une Verticale, il faut en ajouter une deuxieme, si c'est possible
  //     let foundV = false
  //     while (!foundV) {
  //       let id = Math.floor(Math.random() * data.length)
  //       if (data[id].type == "V") {
  //         random.push(data[id])
  //         data.splice(id, 1)
  //         foundV = true
  //       }
  //     }
  //   }
  // }

  let randomCompact = compactVerticalVignette(random)
  let score = scorePresentation(randomCompact)
  // On va itérer 50 fois la descente de gradient
  let nbDescentes = 50
  for (let i = 0; i < nbDescentes; i++) {
    console.log("i : ", i)
    loop1:
    for (let idSwap1 = 1; idSwap1 < randomCompact.length-2; idSwap1++) {
      for (let idSwap2 = idSwap1+1; idSwap2 < randomCompact.length-1; idSwap2++) {
        if (random[idSwap1].type === random[idSwap2].type) { // Si on peut échanger 2 vignettes (compatibilité de type), on tente
          let tmpRandom = Array.from(random)//[...randomCompact]
          let tmp = tmpRandom[idSwap1]
          tmpRandom[idSwap1] = tmpRandom[idSwap2]
          tmpRandom[idSwap2] = tmp
          let newScore = scorePresentation(compactVerticalVignette(tmpRandom))
          if (newScore > score) { // Si l'échange est meilleur on garde ce nouvel agencement de vignettes
            score = newScore
            random = tmpRandom
            console.log(newScore)
            // break loop1
          }
        }
      }
    }
  }
}

// PARTIE ALGO GENETIC :
class Genetic {
  constructor(dataPercent) {
    this.populationSize = 100
    this.generation = 250
    this.population = []
    this.initPopulation(dataPercent)
    this.mutationRate = 0.01
    this.data = data
  }

  initPopulation(dataPercent) {
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(new DNA(dataPercent))
    }
  }

  findBestSolution() {
    for (let i = 0; i < this.generation; i++){
      console.log("New generation")

      console.log(scorePresentation(compactVerticalVignette(genetic.population[0].genes)))
      this.breedNewPopulation()
    }
  }

  breedNewPopulation() {
    this.population.forEach( pop => pop.calculateFitness() )


    let minFit = 1000000
    this.population.forEach( pop => {
      if (pop.fitness < minFit) minFit = pop.fitness
    })
    // Augmenter l'importance des écarts
    this.population.forEach( pop => pop.fitness -= minFit )

    // idem
    // this.population.forEach( pop => pop.fitness = Math.pow(pop.fitness, 2) )

    this.calculatePopulationProbability()

    let tmpPopulation = []
    for (let i = 0; i < this.populationSize; i++) {
      tmpPopulation.push(new DNA(this.data, "similarDNA"))
    }
    this.population = tmpPopulation
  }

  calculatePopulationProbability() {
    let sum = 0
    this.population.forEach( pop => sum += pop.fitness )
    this.population.forEach( pop => pop.probability = pop.fitness / sum )
  }
}

class DNA {
  constructor(dataPercent, similarDNA) {
    this.fitness = 0
    this.probability = 0
    this.genes = []
    if (arguments.length === 1) {
      this.initGenes(dataPercent)
    }
    else {
      this.genesFromParent()
    }
  }
  initGenes(dataPercent) { // Creation d'une solution random
    let data = [...dataPercent] // Deep copy
    while(data.length > 0) {
      let id = Math.floor(Math.random() * data.length)
      this.genes.push(data[id])
      data.splice(id, 1)

      // Utilisé uniquement en présence d'image verticales

      // if (this.genes[this.genes.length -1].type == "V") {
      //   if (getVertical(data).length > 0) {
      //     let foundV = false
      //     while (!foundV) {
      //       let id = Math.floor(Math.random() * data.length)
      //       if (data[id].type == "V") {
      //         this.genes.push(data[id])
      //         data.splice(id, 1)
      //         foundV = true
      //       }
      //     }
      //   }
      //   else {
      //     data.pop()
      //   }
      // }
    }
  }
  genesFromParent() {
    // Selection de 2 parents
    let mother = [...this.pickParent()]
    let father = [...this.pickParent()]
    // CrossOver de ces 2 parents pour  donner un fils
    let randomCross = Math.floor(Math.random()*(mother.length-1))
    for (let m = 0; m < randomCross; m++) {
      this.genes.push(mother[m])
    }

    // On finit de remplir avec les gènes du père
    let i = 0
    while (this.genes.length < mother.length) {
      if (this.genes.find( elem => (father[i].order == elem.order)) === undefined) {
        this.genes.push(father[i])
      }
      i++
    }

    // Mutations potentielles du fils
    // for(let i=0; i<this.genes.length; i++){
    //   let rd = Math.random()
    //   if (rd < program.mutationRate){
    //     this.genes[i] = {x: -0.1 + 0.2*Math.random(), y: -0.1 + 0.2* Math.random()}
    //   }
    // }
  }
  pickParent() {
    let index = 0
    let rdm = Math.random()
    while (rdm > 0) {
      rdm = rdm - genetic.population[index].probability
      index++
    }
    index--
    return genetic.population[index].genes
  }

  calculateFitness() {
    this.fitness = scorePresentation(compactVerticalVignette(this.genes))
  }
}




const PERCENTDATA = 100
let start = new Date() // Benchmark temps

// RECUPERATION DATASET ////////////////////////////////////////////
// let data = getFile("a_example.txt")
// let data = getFile("b_lovely_landscapes.txt")
let data = getFile("c_memorable_moments.txt")
// let data = getFile("d_pet_pictures.txt")
// let data = getFile("e_shiny_selfies.txt")
let dataV = getVertical(data)
let dataH = getHorizont(data)
let dataPercent = getNPicture(data, PERCENTDATA)

// PRESENTATION LINEAIRE BASIQUE //////////////////////////////////
// let linear = linearPresentationHV(dataPercent)
// // writePresentation(linear)
// let linearCompact = compactVerticalVignette(linear)
// console.log(scorePresentation(linearCompact))

// ALGORITHME GLOUTON /////////////////////////////////////////////
// let gloutonne = gloutonnePresentation(dataPercent, 500)
// // writePresentation(gloutonne)
// let gloutCompact = compactVerticalVignette(gloutonne)
// let scoreGlout = scorePresentation(gloutCompact)
// console.log(scoreGlout)

// ALGORITHME CUSTOM POUR DATASET B ////////////////////////////////
// let res = algoCustomDatasetB(dataPercent)
// console.log("score : ", scorePresentation(res))

// ALGORITHME DESCENTE DE GRADIENT ////////////////////////////////
// voisinage(dataPercent)

// ALGORITHME GENETIQUE ///////////////////////////////////////////
// let genetic = new Genetic(dataPercent)
// genetic.findBestSolution()


console.log(new Date() - start, "ms runtime")
