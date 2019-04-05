import sys
sys.setrecursionlimit(100000)

def read(name):
    with open("database/" + name) as file:
        data = map(lambda (index, line): {"type": line[0], "nbFeatures": int(line.split()[1]), "features": line.split()[2:], "index": index},
        enumerate(filter(lambda x: len(x) > 10,
        file.read().splitlines())) )
        return data

getNPicture = lambda data, percent: data[:percent*len(data)/100]
getVertical = lambda data: filter(lambda picture: picture["type"] == "V", data)
getHorizont = lambda data: filter(lambda picture: picture["type"] == "H", data)
linearPresentationHV = lambda data: getHorizont(data) + getVertical(data) if len(getVertical(data)) % 2 == 0 else getHorizont(data) + getVertical(data)[:-1]


# def compactVerticalPicture(presentation):
#     return reduce(lambda acc, picture:
#         acc["result"].append(picture["features"]) if (picture["type"] == "H")
#         else  acc["result"].append(picture["features"]) if (picture["type"] == "V" and not acc["vertical"])
#             acc["vertical"] = True
#
#         presentation,
#         {"vertical": False, "result": []})

def compactVerticalPicture(presentation, acc = {"vertical": False, "result": []}):
    if (len(presentation) == 0):
        return acc["result"]
    else:
        if (presentation[0]["type"] == "H"):
            acc["result"].append(presentation[0]["features"])
            return compactVerticalPicture(presentation[1:], acc)
        elif (presentation[0]["type"] == "V" and not acc["vertical"]):
            acc["result"].append(presentation[0]["features"])
            acc["vertical"] = True
            return compactVerticalPicture(presentation[1:], acc)
        else:
            acc["result"][-1] = list(set(acc["result"][-1] + presentation[0]["features"]))
            return compactVerticalPicture(presentation[1:], acc)



def transitionQuality(slide1, slide2):
    intersection = len(list(set(slide1) & set(slide2)))
    diff1 = len(list(set(slide1).difference(set(slide2))))
    diff2 = len(list(set(slide2).difference(set(slide1))))
    return min(intersection, diff1, diff2)
def scorePresentation(presentation):
    return reduce(lambda acc, features: {"score": acc["score"] + transitionQuality(features, acc["lastFeatures"]), "lastFeatures": features}, presentation, {"score": 0, "lastFeatures": []})["score"]

# data = read('a_example.txt')
data = read('c_memorable_moments.txt')
# data = read('b_lovely_landscapes.txt')
dataPercent = getNPicture(data, 10)
print(len(dataPercent))
dataV = getVertical(data)
dataH = getHorizont(data)

linear = linearPresentationHV(data)
linearCompact = compactVerticalPicture(linear)
print("oui")
print(scorePresentation(linearCompact))