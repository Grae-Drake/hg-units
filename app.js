var unitLibrary = [];
var cityLibrary = [];
$(document).ready(function() {

    // Get the data from Highgrounds git repo and populate results.
    function getUnits() {

        var indexURL = 'https://raw.githubusercontent.com/highgrounds' +
                        '/HighgroundsAssets/master/data/1stEdition.xml';
        var hgData = $.get(indexURL, function() {
            unitLibrary = extractUnitData(parseHighgroundsXml(hgData));
            cityLibrary = extractCityData(parseHighgroundsXml(hgData));
            console.log("cityLibrary:", cityLibrary);
            populatePage(unitLibrary);
        });
    }
    
    function parseHighgroundsXml(hgData) {

        // Get the card data as XML, parse it, and convert it to friendly JSON.
        var xmlString = hgData.responseText;
        var parser = new DOMParser();
        var xml = parser.parseFromString(xmlString, "text/xml");
        return xmlToJson(xml);
    }

    function extractCityData(hgJson) {

        // Build an array of objects from the JSON data holding all cities.
        var cities = [];
        rawCities = hgJson.data.CITYLIST.CITY;
        // CITY.ACTION is an array of objects for gold, crystal, recruit etc.
        // ACTION.attributes each has .location, .type, and .value.
        // CITY.TYPE is an array of objects with a .#text of, e.g., "Human" and "Magic".
        // CITY.attributes includes .edition, .groundType, .id, .name, and .rarity.

        // Omit the first "dummy" unit.
        for (var i = 1 ; i < rawCities.length ; i++) {
            var rawCity = rawCities[i];
            var attributes = rawCity.attributes;
            var actions = [];
            var types = [];

            // Populate actions array.
            for (var j = 0 ; j < rawCity.ACTION.length ; j ++) {
                var action = rawCity.ACTION[j];
                actions.push({
                    "location": action.attributes.location,
                    "type": action.attributes.type,
                    "value": action.attributes.value
                });
            }

            // Populate types array. Raw types can be an array or an object.
            if ($.isArray(rawCity.TYPE)) {
                for (var k = 0 ; k < rawCity.TYPE.length ; k ++) {
                    var type = rawCity.TYPE[k];
                    types.push(type["#text"]);
                }
            }
            else if (typeof(rawCity.TYPE === "object")) {
                types.push(rawCity.TYPE["#text"]);
            }

            cities.push({
                "name": attributes.name,
                "id": attributes.id,
                "rarity": attributes.rarity,
                "groundType": attributes.groundType,
                "edition": attributes.edition,
                "actions": actions,
                "types": types

            });
        }

        return cities;
    }

    function extractUnitData(hgJson) {

        // Build an array of objects from the JSON data holding all units.
        // Omit the first "unknown" placeholder unit.
        var cards = [];
        
        // Rarity map from numbers to English.
        rarities = {
            0: "Common",
            1: "Uncommon",
            2: "Rare",
            3: "Ultra Rare",
            4: "Legendary"
        };

        // Iterate over the raw unit data.
        rawCards = hgJson.data.CARDLIST.CARD;
        for (var i = 1 ; i < rawCards.length ; i++) {
            var rawCard = rawCards[i];
            var attributes = rawCard.attributes;
            var homeActions = [];
            var battleActions = [];
            var types = [];

            // Populate homeActions and battleActions arrays.
            for (var j = 0 ; j < rawCard.ACTION.length ; j ++) {
                var action = rawCard.ACTION[j].attributes;
                var target = action.location === "home" ? homeActions : battleActions;
                
                // Deal with weird action values like -9999 for "X" and
                // -1000 for actions like frail and dormant.
                var actionValue = action.value === "-9999" ? "X" :
                                  action.value === "-1000" ? "" :
                                  action.value;

                // Deal with weird action types like Windfall and "duorainer" typo.
                var actionType = action.type.indexOf("windfall") > -1 ? "windfall" :
                                 action.type.indexOf("duorainer") > -1 ? "duoRainer" :
                                 action.type;

                target.push({"type": actionType, "value": actionValue});
            }

            // Populate types array. Raw types can be an array or an object.
            if ($.isArray(rawCard.TYPE)) {
                for (var k = 0 ; k < rawCard.TYPE.length ; k++) {
                    types.push(rawCard.TYPE[k]["#text"]);
                }
            } else if (typeof(rawCard.TYPE) === "object") {
                types.push(rawCard.TYPE["#text"]);
            }
            
            cards.push({
                "name": attributes.name,
                "cost": {"gold": parseInt(attributes.g, 10),
                         "crystal": parseInt(attributes.c, 10),
                         "wood": parseInt(attributes.w, 10)},
                "edition": attributes.edition,
                "id": attributes.id,
                "rarity": rarities[parseInt(attributes.rarity, 10)],
                "homeActions": homeActions,
                "battleActions": battleActions,
                "types": types
            });
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
    function populatePage(units) {

        Handlebars.registerHelper('toUpperCase', function(str) {
            return str.toUpperCase();
        });
        var theTemplateScript = $("#unit-card").html();
        var theTemplate = Handlebars.compile(theTemplateScript);

        for (var i = 0 ; i < units.length ; i++) {
            var unit = units[i];
        $(".units").append(theTemplate(unit));
        }

    }
});