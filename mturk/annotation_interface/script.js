

function getSentenceHTMLElement(sentence, highlightEntIndex) {
    // return string constructed with tokens and spaces in [start, end)
    function getTextFromSpanForTokenSpaces(tokenSpaces, start, end) {
        return tokenSpaces.slice(start, end).reduce(function(acc, tokenSpace) {
            return acc + tokenSpace[0] + tokenSpace[1];
        }, "");
    }
    var wrapTextInMark = function(text, addNoFocus) {
        return ('<mark data-entity="" ' +
            (addNoFocus?'class="entity-nofocus"':'') +
            '>' + text + '</mark>')};

    // tuples of tokens, spaces ( => zip(tokens, spaces) )
    var tokenSpaces = sentence.tokens.map(function(t, i) { 
        return [t, sentence.spaces[i]]; });
    var getTextFromSpan = function(start, end) {
        return getTextFromSpanForTokenSpaces(tokenSpaces, start, end);}
    var sentLen = tokenSpaces.length;
    var ents = sentence.ents.sort(function(e1, e2) {return e1.start - e2.start});

    var sentNode = document.createElement('div');
    // now populate sentNode with sentence contents by iterating through ents
    if (ents.length == 0)
        sentNode.innerText = getTextFromSpan(0, sentLen);
    else {
        var sentInnerHTML = "";
        var lastEntEnd = 0;
        ents.forEach(function(ent, entIndex) {
            // add text before the entity
            sentInnerHTML += getTextFromSpan(lastEntEnd, ent.start);
            // add entity wrapped in <mark>
            var addNoFocus = (highlightEntIndex !== undefined && entIndex != highlightEntIndex)
            sentInnerHTML += wrapTextInMark(getTextFromSpan(ent.start, ent.end), addNoFocus);
            lastEntEnd = ent.end;
        });
        // add text after the last entity
        sentInnerHTML += getTextFromSpan(lastEntEnd, sentLen);
        sentNode.innerHTML = sentInnerHTML;
    }
    return sentNode;
}

function getDocHTMLNode(docJson) {
    // listItem template
    var sentTmpl = document.getElementById('sentence-template');

    var listNode = document.createElement('div');
    listNode.classList.add('list-group');

    for (var sentenceIdx in docJson['sentences']) {
        if (docJson['sentences'].hasOwnProperty(sentenceIdx)) {
            var sentence = docJson['sentences'][sentenceIdx];
            var sentHTMLElement = getSentenceHTMLElement(sentence);

            var sentContainer = sentTmpl.content.cloneNode(true);
            sentContainer.querySelector('div.sentence-content').appendChild(sentHTMLElement);
            sentContainer.querySelector('span.sentence-list-index').innerText = parseInt(sentenceIdx)+1

            var listItemNode = document.createElement('div');
            listItemNode.classList.add('list-group-item');
            listItemNode.appendChild(sentContainer);

            listNode.appendChild(listItemNode);
        }
    }
    return listNode;
}


function highlightMention(docViewNode, sentIndex) {
    var listItem = docViewNode.querySelector('.list-group').childNodes[sentIndex];
    if (listItem == undefined)
        console.log("wrong sentIndex - " + sentIndex);
    else
        listItem.classList.add('active');
}


// global variable to keep track of the current document
// change this design later
var globalData = {};
globalData.curDocJson = null;

function getDocument(callback) {
    document.getElementById("load-doc").disabled = true;

    var httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      alert('Giving up :( Cannot create an XMLHTTP instance');
      return false;
    }
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                var response = JSON.parse(httpRequest.responseText);
                globalData.curDocJson = response;
                console.log(response['sentences'][0]['tokens']);
                callback(response);
            } else {
                alert('There was a problem with the request.');
            }
        }
    };
    httpRequest.open('GET', './sample_doc.json', true);
    httpRequest.send(null);

    console.log('button pressed! XMLHttpRequest for doc content sent.');
}


function parseFigerHier(typeHier) {
    // given the type-hier as presented in figer_type_hier.json,
    // creates a dictionary from coarse types to all its fine-types
    var getCoarse = function(type) {
        while (typeHier[type]['parent'] != null)
            type = typeHier[type]['parent'];
        return type;
    }
    coarseToFine = {};
    for (var type in typeHier) {
        if (typeHier.hasOwnProperty(type)) {
            var coarse = getCoarse(type);
            // add coarse type to dictionary
            if (!coarseToFine.hasOwnProperty(coarse))
                coarseToFine[coarse] = []
            // if this is a fine type add this to the coarse type list
            if (typeHier[type]['parent'] != null)
                coarseToFine[coarse].push(type)
        }
    }
    return coarseToFine;
}


function loadFigerHier() {

    var httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      alert('Giving up :( Cannot create an XMLHTTP instance');
      return false;
    }
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                var response = JSON.parse(httpRequest.responseText);
                globalData.typeHier = response;
                globalData.coarseToFine = parseFigerHier(response);
            } else {
                alert('There was a problem with the figer-hier request.');
            }
        }
    };
    httpRequest.open('GET', './figer_type_hier.json', false);
    httpRequest.send(null);

    console.log('XMLHttpRequest for figer-hier sent.');
}


function toggleMenu(node, collapseId) {
    // toggle glyphicon
    var glyphiconSpan = node.querySelector('span.glyphicon');
    if (glyphiconSpan == undefined) return
    classList = glyphiconSpan.classList
    var menuUpClass = 'glyphicon-menu-up';
    var menuDownClass = 'glyphicon-menu-down';
    var collapseNode = document.getElementById(collapseId);
    if (classList.contains(menuUpClass)) {
        // content hidden
        classList.remove(menuUpClass);
        classList.add(menuDownClass);
        collapseNode.classList.add('open-block');
    }
    else if (classList.contains(menuDownClass)) {
        // content visible
        classList.remove(menuDownClass);
        classList.add(menuUpClass);
        collapseNode.classList.remove('open-block');
    }
}