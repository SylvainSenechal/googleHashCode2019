# -*- coding: utf-8 -*-

import sys
from gurobipy import *
sys.setrecursionlimit(100000)

def read(name):
    with open("database/" + name) as file:
        data = map(lambda (index, line): {"type": line[0], "nbFeatures": int(line.split()[1]), "features": line.split()[2:], "index": index},
        enumerate(filter(lambda x: len(x) > 5,
        file.read().splitlines())) )
        return data

getPercent = lambda data, percent: data[:int(percent*len(data)/100)]
getNPicture = lambda data, N: data[:N]
getVertical = lambda data: filter(lambda picture: picture["type"] == "V", data)
getHorizont = lambda data: filter(lambda picture: picture["type"] == "H", data)
linearPresentationHV = lambda data: getHorizont(data) + getVertical(data) if len(getVertical(data)) % 2 == 0 else getHorizont(data) + getVertical(data)[:-1]


def compactVerticalPicture(presentation):
    result = []
    while (len(presentation) > 0):
        if (presentation[0]["type"] == "H"):
            result.append(presentation[0]["features"])
            presentation.pop(0)
        else:
            result.append(list(set(presentation[0]["features"] + presentation[1]["features"])))
            presentation.pop(0)
            presentation.pop(0)
    return result


def transitionQuality(slide1, slide2):
    intersection = len(list(set(slide1) & set(slide2)))
    diff1 = len(list(set(slide1).difference(set(slide2))))
    diff2 = len(list(set(slide2).difference(set(slide1))))
    return min(intersection, diff1, diff2)
def scorePresentation(presentation):
    return reduce(lambda acc, features: {"score": acc["score"] + transitionQuality(features, acc["lastFeatures"]), "lastFeatures": features}, presentation, {"score": 0, "lastFeatures": []})["score"]

# TODO: vertifier que le data pop presentation 0 index retire le bon ou putot faire un filter
def gloutonnePresentation(data, depthSearch = 5):
    # On choisi arbitrairement une premiere image
    if (len(getHorizont(data)) > 0): # Dans le cas du dataset e_shiny_selfies on a que des Verticales donc on peut pas juste piocher dans les horizontales tout le temps
        presentation = [getHorizont(data)[0]]
        arrayFeatures = [presentation[0]["features"]] # On utilise arrayFeatures en plus de la presentation, pour concatener les features si on rencontre 2 images verticales, pour le calcul plus simple de la transition
        data.pop(presentation[0]["index"]) # on supprime de la liste ouverte cette premiere image
    else: # Selection de 2 verticales dans le cas du dataset e_shiny_selfies
        presentation = [getVertical(data)[0]]
        presentation.append(getVertical(data)[1])
        data.pop(presentation[0]["index"])
        data.pop(presentation[1]["index"])
        arrayFeatures = [ list( set(presentation[0]["features"]) | set(presentation[1]["features"]) ) ]

    # Boucle de choix des autres images
    while (len(data) > 0):
        # Ajout d une image maximisant la transition
        bestTransition = reduce(lambda acc, picture: picture if transitionQuality(arrayFeatures[-1], picture["features"]) > transitionQuality(arrayFeatures[-1], acc["features"]) else acc, getNPicture(data, depthSearch), data[0])
        data = filter(lambda picture: picture["index"] != bestTransition["index"], data)
        presentation.append(bestTransition)
        arrayFeatures.append(bestTransition["features"])
        # Si on a ajoute une image Verticale, il faut en rajouter une deuxieme selon le même procede
        if (presentation[-1]["type"] == "V"):
            if (len(getVertical(data)) == 0): # S il n y a plus de deuxieme image verticale disponible, on retire celle qu on vient d ajouter
                presentation = presentation[:-1]
            else:
                bestTransition = reduce(lambda acc, picture: picture if transitionQuality(arrayFeatures[-2], list(set(arrayFeatures[-1]) | set(picture["features"]))) > transitionQuality(arrayFeatures[-2], list(set(arrayFeatures[-1]) | set(acc["features"]))) else acc, getNPicture(getVertical(data), depthSearch), getVertical(data)[0])
                data = filter(lambda picture: picture["index"] != bestTransition["index"], data)
                presentation.append(bestTransition)
                arrayFeatures[-1] = list( set(arrayFeatures[-1]) | set(bestTransition["features"]))
    return presentation

# def gloutonnePresentation(data, depthSearch = 10):
#     presentation = [getHorizont(data)[0]]
#     data.pop(presentation[0]["index"])
#     while (len(data) > 0):
#         # bestTransition = data[0]
#         # for element in data:
#         #     if (transitionQuality(bestTransition["features"], presentation[-1]["features"]) > transitionQuality(element["features"], presentation[-1]["features"])):
#         #         bestTransition = element
#         bestTransition = reduce(lambda acc, picture: picture if transitionQuality(presentation[-1]["features"], picture["features"]) > transitionQuality(presentation[-1]["features"], acc["features"]) else acc, data, data[0])
#
#         presentation.append(bestTransition)
#         data = filter(lambda picture: picture["index"] != bestTransition["index"], data)
#     return presentation

# data = read('a_example.txt')
# data = read('c_memorable_moments.txt')
data = read('b_lovely_landscapes.txt')
# data = read('d_pet_pictures.txt')
# data = read('e_shiny_selfies.txt')
dataPercent = getPercent(data, 1)
dataV = getVertical(data)
dataH = getHorizont(data)

# linear = linearPresentationHV(dataPercent)
# linearCompact = compactVerticalPicture(linear)
# scoreLinear = scorePresentation(linearCompact)
# print(scoreLinear)
#
# gloutPresentation = gloutonnePresentation(dataPercent)
# gloutCompact = compactVerticalPicture(gloutPresentation)
# scoreGlout = scorePresentation(gloutCompact)
# print(scoreGlout)


##############
## PARTIE PLNE
##############

def solve(dataPLNE):
  # Création du modèle
  m = Model()
  # # Calcul de la matrice des distances
  dist = {(i,j):
      PLNEtransitionDistance(dataPLNE[i]["features"], dataPLNE[j]["features"])
      for i in range(n) for j in range(i)}


  # Creation des variables binairespour chaque distance
  vars = m.addVars(dist.keys(), obj=dist, vtype=GRB.BINARY, name='e')
  for i,j in vars.keys():
      vars[j,i] = vars[i,j] # edge in opposite direction

  # Ajout contrainte chaque vignette a une vignette suivante et precedente
  m.addConstrs(vars.sum(i,'*') == 2 for i in range(n))
  # Optimization du modèle
  m._vars = vars
  m.Params.lazyConstraints = 1
  # Utilisation d'un callback avec "lazy constraints" pour ne pas
  # faire systèmatiquement la vérification de présence de sous-tours
  m.optimize(subtourelim)

  # Récupération et affichage du résultat
  vals = m.getAttr('x', vars)
  selected = tuplelist((i,j) for i,j in vals.keys() if vals[i,j] > 0.5)
  tour = subtour(selected)

  print('')
  print('Optimal tour: %s' % str(tour))
  print('Optimal cost: %g' % m.objVal)
  print('Qualite de la solution : ', n*100-m.objVal)
  print('')

  open('resultPLNE.txt', 'w').close() # On clean la derniere solution
  with open('resultPLNE.txt', 'a') as file:
    file.write(str(len(tour)) + '\n')
    for i in range (len(tour)):
      file.write(str(tour[i]) + '\n')
  # a = list(set(tour))
  # print(len(a))
def PLNEtransitionDistance(slide1, slide2):
    intersection = len(list(set(slide1) & set(slide2)))
    diff1 = len(list(set(slide1).difference(set(slide2))))
    diff2 = len(list(set(slide2).difference(set(slide1))))
    return 100 - min(intersection, diff1, diff2)

def subtourelim(model, where):
    if where == GRB.Callback.MIPSOL:
        # make a list of edges selected in the solution
        vals = model.cbGetSolution(model._vars)
        selected = tuplelist((i,j) for i,j in model._vars.keys() if vals[i,j] > 0.5)
        # find the shortest cycle in the selected edge list
        tour = subtour(selected)
        if len(tour) < n:
            # add subtour elimination constraint for every pair of cities in tour
            model.cbLazy(quicksum(model._vars[i,j]
                                  for i,j in itertools.combinations(tour, 2))
                         <= len(tour)-1)


# Given a tuplelist of edges, find the shortest subtour

def subtour(edges):
  # n : nombre de vignettes <=> nodes
  #n = len(dataPLNE)
  unvisited = list(range(n))
  cycle = range(n+1) # initial length has 1 more city
  while unvisited: # true if list is non-empty
    thiscycle = []
    neighbors = unvisited
    while neighbors:
      current = neighbors[0]
      thiscycle.append(current)
      unvisited.remove(current)
      neighbors = [j for i,j in edges.select(current,'*') if j in unvisited]
    if len(cycle) > len(thiscycle):
      cycle = thiscycle
  return cycle


dataPLNE = getPercent(read('b_lovely_landscapes.txt'), 0.6)
n = len(dataPLNE)
solve(dataPLNE)


#### Commentaires pour le dossier
# Parler du fait qu'on peut prendre dans le sens inverse les features pour b

# Autre gloutonne : Trier par nombre de features decroissants, ajouter une depthSearch

# gerer shiny selfie que verticale .., ne pas initialiser rentrer direct dans while ?
# faire un histogramme de la repartition des features
