var unitLibrary = [];
$(document).ready(function() {

    // Get the data from Highgrounds git repo and populate results.
    function getUnits() {

        var indexURL = "https://raw.githubusercontent.com/highgrounds/HighgroundsAssets/master/data/1stEdition.xml";
        var unitData = $.get(indexURL, function() {
            unitLibrary = parseHighgroundsXml(unitData);
            // populatePage(unitLibrary);
        });
    }
    
    function parseHighgroundsXml(unitData) {

        // Get the card data as XML, parse it, and convert it to JSON.
        var xmlString = unitData.responseText;
        var parser = new DOMParser();
        var xml = parser.parseFromString(xmlString, "text/xml");
        cardJson = xmlToJson(xml);

        // Build an array of objects from the JSON data holding all cards.
        // Omit the first placeholder unit.
        var cards = [];
        rawCards = cardJson.data.CARDLIST.CARD;

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

            // Each card can one or more actions.
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
        return cards;
    }

    function populatePage(units) {
        
        rarities = {
            0: "Common",
            1: "Uncommon",
            2: "Rare",
            3: "Ultra Rare",
            4: "Legendary"
        };

        for (var i = 0 ; i < units.length ; i++) {
            var unit = units[i];
            // console.log(unit.name, unit);
            var frontRow = [];
            var backRow = [];
            for (var k = 0 ; k < unit.actions.length ; k++) {
                var action = unit.actions[k];

                // Deal with weird values like -9999 for "X" and -1000 for
                // actions like frail and dormant.
                var value = action.value === "-9999" ? "X" :
                            action.value === "-1000" ? "" :
                                             action.value;
                var type = action.type;

                if (unit.actions[k].location === "battle") {
                    frontRow.push(["<li>", value, " ", type, "</li>" ].join(""));
                }
                else if (unit.actions[k].location === "home") {
                    backRow.push(["<li>", value, " ", type, "</li>" ].join(""));
                }
            }
            $(".units").append([
                "<h5>","Name: ", unit.name, "</h6>",
                "<p>", unit.types.join(" "), "</p>",
                "<ul>Cost:",
                "<li>", unit.cost.gold, " gold", "</li>",
                "<li>", unit.cost.crystal, " crystal", "</li>",
                "<li>", unit.cost.wood, " wood", "</li>",
                "</ul>",
                "<p>", rarities[unit.rarity], "</p>",
                "<ul>Front Row:", frontRow.join(""), "</ul>",
                "<ul>Back Row:", backRow.join(""), "</ul>"
                ].join(""));
        }
    }

    function getActiveResources() {
        activeButtons = $('.button-primary');
        activeResources = [];
        for (var i = 0 ; i < activeButtons.length ; i++) {
            activeResources.push($(activeButtons[i]).data("resourceType"));
        }
        return activeResources;
    }

    function filterUnits(unitLibrary, activeResources) {
        return unitLibrary.filter(function(unit) {
            for (var i = 0 ; i < activeResources.length ; i ++) {
                if (unit.cost[activeResources[i]] > 0) {
                    return true;
                }
            }
        });
    }
    // Event handlers.
    $('button.resource').on('click', function() {
        $(this).toggleClass('button-primary');

        activeResources = getActiveResources();
        $('.units').empty();
        populatePage(filterUnits(unitLibrary, activeResources));

    });
    getUnits();

    // Templating.
    var dante = {"name": "DANTE",
                 // "type": ["Wraith", "Golem"],
                 "cost": "4 Crystal"
                 // "rarity": "Common",
                 // "actions back": ["2 Defense", "1 Gold"],
                 // "actions front": ["4 Attack", "1 Crystal"]
    };

    var theTemplateScript = $("#unit-card").html();
    var theTemplate = Handlebars.compile(theTemplateScript);
    $(".units").append(theTemplate(dante));
});