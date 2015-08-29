// Note: adding filtering by city resource.  Instead of having "actions" on
// a city, you should give each city a straight "gold", "wood", "recruit", etc. property.


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
            populateCities(cityLibrary);
            populateUnits(unitLibrary);

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
        console.log(rawCities);
        // CITY.ACTION is an array of objects for gold, crystal, recruit etc.
        // ACTION.attributes each has .location, .type, and .value.
        // CITY.TYPE is an array of objects with a .#text of, e.g., "Human" and "Magic".
        // CITY.attributes includes .edition, .groundType, .id, .name, and .rarity.

        // Omit the first "dummy" unit.
        for (var i = 1 ; i < rawCities.length ; i++) {
            var rawCity = rawCities[i];
            var attributes = rawCity.attributes;
            var types = [];
            var gold = 0;
            var crystal = 0;
            var wood = 0;
            var recrui = 0;

            // Plug in resource production and recruit.
            for (var j = 0 ; j < rawCity.ACTION.length ; j ++) {
                var action = rawCity.ACTION[j];
                switch (action.attributes.type) {
                    case "gold":
                        gold = action.attributes.value;
                        break;
                    case "crystal":
                        crystal = action.attributes.value;
                        break;
                    case "wood":
                        wood = action.attributes.value;
                        break;
                    case "recruit":
                        recruit = action.attributes.value;
                        break;
                }
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
                "types": types,
                "gold": gold,
                "crystal": crystal,
                "wood": wood,
                "recruit": recruit
            });
        }

        return cities;
    }

    function extractUnitData(hgJson) {

        // Build an array of objects from the JSON data holding all units.
        // Omit the first "unknown" placeholder unit.
        var cards = [];
        
        // Rarity map from numbers to English.
        var rarities = {
            0: "Common",
            1: "Uncommon",
            2: "Rare",
            3: "Ultra Rare",
            4: "Legendary"
        };

        // Iterate over the raw unit data.
        var rawCards = hgJson.data.CARDLIST.CARD;
        // Start from i=1 to skip the empty card.
        for (var i = 1, len = rawcards.length; i < len; i++) {
            var card = parseCard(rawcards[i]);
            cards.push(card);
        }
        return cards;
    }

    function getActiveCities() {
        activeButtons = $('.button-primary');
        return cityLibrary.filter(function(city) {
            for (var i = 0 ; i < activeButtons.length ; i++) {
                if ($(activeButtons[i]).data("cityId") === city.id) {
                    return true;
                }
            }
        });
    }

    function filterUnits(unitLibrary, activeCities) {
        return unitLibrary.filter(function(unit) {

            // Always include free units.
            if (unit.cost.gold === 0 && unit.cost.crystal === 0 && unit.cost.wood === 0 ) {
                return true;
            }

            // Check whether the unit's cost matches each active city.
            for (var i = 0 ; i < activeCities.length ; i ++) {
                var city = activeCities[i];
                if ((unit.cost.gold > 0) === (city.gold > 0) &&
                         (unit.cost.crystal > 0) === (city.crystal > 0) &&
                         (unit.cost.wood > 0) === (city.wood > 0)) {
                    return true;
                }
            }
        });
    }

    // Templating.
    function populateUnits(units) {

        for (var i = 0 ; i < units.length ; i++) {
            var unit = units[i];
            $(".units").append(unitTemplate(unit));
        }
        $(".unit-sprite img").on("error abort", function() {
            this.src="images/outline.png";
        });
    }
    
    var unitTemplateScript = $("#unit-card").html();
    var _unitTemplate = Handlebars.compile(unitTemplateScript);
    
    function unitTemplate(unit) {
        
        var unitHTML = unit._cache;
        if (unitHTML === undefined){
            unitHTML = unit._cache = _unitTemplate(unit);
        }
        return unitHTML;
    }
    
    function populateCities(cities) {

        var cityTemplateScript = $("#city-button").html();
        var cityTemplate = Handlebars.compile(cityTemplateScript);
        for (var j = 0 ; j < cities.length ; j++) {
            var city = cities[j];
            $(".cities").append(cityTemplate(city));
        }
        $('.city').on('click', function() {
            $(this).toggleClass('button-primary');
            activeCities = getActiveCities();
            $('.units').empty();
            populateUnits(filterUnits(unitLibrary, activeCities));
        });
    }
    
    Handlebars.registerHelper('toUpperCase', function(str) {
        return str.toUpperCase();
    });

    function parseCard(rawCard) {
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
            "types": types
        }

        // Populate homeActions and battleActions arrays.
        for (var j = 0 ; j < rawCard.ACTION.length ; j ++) {
            var action = rawCard.ACTION[j].attributes;
            var target = action.location === "home" ? homeActions : battleActions;
            
            target.push(parseAction(action));
        }

        // Populate types array. Raw types can be an array or an object.
        if ($.isArray(rawCard.TYPE)) {
            for (var k = 0 ; k < rawCard.TYPE.length ; k++) {
                types.push(rawCard.TYPE[k]["#text"]);
            }
        } else if (typeof(rawCard.TYPE) === "object") {
            types.push(rawCard.TYPE["#text"]);
        }
        
        return card;
    }
    function parseAction(action) {
        // Deal with weird action values like -9999 for "X" and
        // -1000 for actions like frail and dormant.
        var actionValue = action.value === "-9999" ? "X" :
                          action.value === "-1000" ? "" :
                          action.value;

        // Deal with weird action types like Windfall and "duorainer" typo.
        var actionType = action.type.indexOf("windfall") > -1 ? "windfall" :
                         action.type.indexOf("duorainer") > -1 ? "duoRainer" :
                         action.type;
        
        return {"type": actionType, "value": actionValue};
    }
    // Go time.
    getUnits();
});
