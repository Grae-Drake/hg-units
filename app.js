var unitLibrary = [];
$(document).ready(function() {
    function getUnits() {

        var indexURL = "https://raw.githubusercontent.com/highgrounds/HighgroundsAssets/master/data/1stEdition.xml";
        var unitData = $.get(indexURL, function() {

            // Get the card data as XML, parse it, and convert it to JSON.
            var xmlString = unitData.responseText;
            var parser = new DOMParser();
            var xml = parser.parseFromString(xmlString, "text/xml");
            cardJson = xmlToJson(xml);

            // Build an object from the JSON data holding all cards.
            // Omit the first placeholder unit.
            rawCards = cardJson.data.CARDLIST.CARD;
            console.dir(rawCards);
            var cards = [];
            for (var i = 1 ; i < rawCards.length ; i++) {
                var rawCard = rawCards[i];
                var name = rawCard.attributes.name;
                var attributes = rawCard.attributes;
                var actions = [];
                var types = [];
                var card = {
                    "name": attributes.name,
                    "cost": {"gold": attributes.g, "crystal": attributes.c, "wood": attributes.w},
                    "edition": attributes.edition,
                    "id": attributes.id,
                    "rarity": attributes.rarity
                };

                // Each card can have several actions.
                if (rawCard.hasOwnProperty("ACTION")) {
                    for (var j = 0 ; j < rawCard.ACTION.length ; j ++) {
                        actions.push(rawCard.ACTION[j].attributes);
                    }
                    card["actions"] = actions;
                }

                // Each card can have one or more types.
                if (rawCard.hasOwnProperty("TYPE")) {
                    if ($.isArray(rawCard.TYPE)) {
                        for (var k = 0 ; k < rawCard.TYPE.length ; k++) {
                            types.push(rawCard.TYPE[k]["#text"]);
                        }
                    } else if (typeof(rawCard.TYPE) === "object") {
                        types.push(rawCard.TYPE["#text"]);
                    }

                    card["types"] = types;
                }
                cards.push(card);
            }

            // Push the result out to our unitLibrary global variable.
            unitLibrary = cards;
        });
    }

    function presto(meh) {
        
        rarities = {
            0: "Common",
            1: "Uncommon",
            2: "Rare",
            3: "Ultra Rare",
            4: "Legendary"
        };

        console.log(meh.name, meh.types);

        $(".units").append([
            "<h5>","Name: ", meh.name, "</h6>",
            "<p>", meh.types.join(" "), "</p>",
            "<ul>Cost:",
            "<li>", meh.cost.gold, " gold", "</li>",
            "<li>", meh.cost.crystal, " crystal", "</li>",
            "<li>", meh.cost.wood, " wood", "</li>",
            "</ul>",
            "<p>", rarities[meh.rarity], "</p>"
            ].join(""));
    }

    // Event handlers.
    $('button').on('click', function() {
        $this = $(this);
        console.log("clicked", $this.data("resourceType"), "button");
        $('.units').empty();
        $this.toggleClass('button-primary');

        activeButtons = $('.button-primary');
        activeResources = [];
        for (var i = 0 ; i < activeButtons.length ; i++) {
            activeResources.push($(activeButtons[i]).data("resourceType"));
        }
        console.log('Active resources:', activeResources);

        var filteredUnits = unitLibrary.filter(function(unit) {
            for (var j = 0 ; j < activeResources.length ; j ++) {
                if (unit.cost[activeResources[j]] > 0) {
                    return true;
                }
            }
        });
        for (var k = 0 ; k < filteredUnits.length ; k ++) {
            presto(filteredUnits[k]);
        }

    });
    getUnits();
});