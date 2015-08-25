$(document).ready(function() {
    function getUnits() {

        var indexURL = "https://raw.githubusercontent.com/highgrounds/HighgroundsAssets/master/data/1stEdition.xml";
        var unitData = $.get(indexURL, function() {

            // Get the card data as XML, parse it, and convert it to JSON
            var xmlString = unitData.responseText;
            var parser = new DOMParser();
            var xml = parser.parseFromString(xmlString, "text/xml");
            cardJson = xmlToJson(xml);

            // Build an object from the JSON data holding all cards
            rawCards = cardJson.data.CARDLIST.CARD;
            console.dir(rawCards);
            var cards = [];
            for (var i = 0 ; i < rawCards.length ; i++) {
                var rawCard = rawCards[i];
                var name = rawCard.attributes.name;
                var attributes = rawCard.attributes;
                var actions = [];
                var card = {
                    "name": attributes.name,
                    "cost": {"g": attributes.g, "c": attributes.c, "w": attributes.w},
                    "edition": attributes.edition,
                    "id": attributes.id,
                    "rarity": attributes.rarity
                };

                // Each card can have several actions
                if (rawCard.hasOwnProperty("ACTION")) {
                    for (var j = 0 ; j < rawCard.ACTION.length ; j ++) {
                        actions.push(rawCard.ACTION[j].attributes);
                    }
                    card["actions"] = actions;
                }
                cards.push(card);
            }
            for (var k in cards) {
                presto(cards[k]);
            }
        });
    }

    function presto(meh) {
        console.log(meh);
        $("body").append("<p>" + JSON.stringify(meh) + "</p>");
    }
    getUnits();
});