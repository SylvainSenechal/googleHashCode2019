# -*- coding: utf-8 -*-

import sys
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
data = read('c_memorable_moments.txt')
# data = read('b_lovely_landscapes.txt')
# data = read('d_pet_pictures.txt')
# data = read('e_shiny_selfies.txt')
dataPercent = getPercent(data, 100)
dataV = getVertical(data)
dataH = getHorizont(data)

linear = linearPresentationHV(dataPercent)
linearCompact = compactVerticalPicture(linear)
scoreLinear = scorePresentation(linearCompact)
print(scoreLinear)

gloutPresentation = gloutonnePresentation(dataPercent)
gloutCompact = compactVerticalPicture(gloutPresentation)
scoreGlout = scorePresentation(gloutCompact)
print(scoreGlout)

# Autre gloutonne : Trier par nombre de features decroissants, ajouter une depthSearch

# gerer shiny selfie que verticale .., ne pas initialiser rentrer direct dans while ?
# faire un histogramme de la repartition des features
