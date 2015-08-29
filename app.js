var unitLibrary = [];
$(document).ready(function() {

    // Get the data from Highgrounds git repo and populate results.
    function getUnits() {

        var indexURL = "https://raw.githubusercontent.com/highgrounds/HighgroundsAssets/master/data/1stEdition.xml";
        var unitData = $.get(indexURL, function() {
            unitLibrary = parseHighgroundsXml(unitData);
            populatePage(unitLibrary);
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
        var rawCards = cardJson.data.CARDLIST.CARD;
        var rarities = {
            0: "Common",
            1: "Uncommon",
            2: "Rare",
            3: "Ultra Rare",
            4: "Legendary"
        };
        
        // Start from i=1 to skip the empty card.
        for (var i = 1, len = rawcards.length ; i < len ; i++) {
            var card = parseCard(rawcards[i]);
            cards.push(card);
        }
        return cards;
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
            activeResources.some(function(resource){
                return unit.cost[resource] > 0;
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
    function populatePage(units) {

        Handlebars.registerHelper('toUpperCase', function(str) {
            return str.toUpperCase();
        });
        var theTemplateScript = $("#unit-card").html();
        var theTemplate = Handlebars.compile(theTemplateScript);

        for (var i = 0, len = units.length; i < len; i++) {
            var unit = units[i];
            console.log(unit.name, unit);
            
            // easy memoization of the template result
            var unitDisplay = unit["_cache"];
            if (unitDisplay === undefined) {
                unitDisplay = unit["_cache"] = theTemplate(unit);
            }
            
            $(".units").append(unitDisplay);
        }

    }
    
    function parseCard(rawCard){
        
        var name = rawCard.attributes.name;
        var attributes = rawCard.attributes;
        var homeActions = [];
        var battleActions = [];
        var types = [];
        var card = {
            "name": attributes.name,
            "cost": {"gold": parseInt(attributes.g, 10),
                     "crystal": parseInt(attributes.c, 10),
                     "wood": parseInt(attributes.w, 10)},
            "edition": attributes.edition,
            "id": attributes.id,
            "rarity": rarities[parseInt(attributes.rarity, 10)],
            "homeActions": homeActions,
            "battleActions": battleActions,
            "types": types,
        };

        // Each card can one or more home or battle actions.
        if (rawCard.hasOwnProperty("ACTION")) {
            for (var j = 0; j < rawCard.ACTION.length; j++) {
                var action = rawCard.ACTION[j].attributes;
                var target = action.location === "home" ? homeActions : battleActions;
                
                target.push(parseAction(action));
            }
        }

        // Each card can have one or more types.
        if (rawCard.hasOwnProperty("TYPE")) {
            var rawTypes = rawCard.TYPE;
            if ($.isArray(rawTypes)) {
                for (var k = 0 ; k < rawTypes.length ; k++) {
                    types.push(rawTypes[k]["#text"]);
                }
            } else if (typeof(rawTypes) === "object") {
                types.push(rawTypes["#text"]);
            }
        }
    }

    // Returns a dict for the action: {type:, value:}
    function parseAction(action){
        // Deal with weird action values like -9999 for "X" and
        // -1000 for actions like frail and dormant.
        var actionValue = action.value === "-9999" ? "X" :
                          action.value === "-1000" ? "" :
                          action.value;

        // Deal with weird action types like Windfall
        var actionType = action.type.indexOf("windfall") > -1 ? "windfall" :
                         action.type.indexOf("duorainer") > -1 ? "duorainer" :
                         action.type.indexOf("duoRainer") > -1 ? "duorainer" :
                         action.type;
        
        return {"type": actionType, "value": actionValue};
    }

});
