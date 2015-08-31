
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

        // sort cities
        var cityOrder = ["Titan Ridge", "Dwila", "Sacred Woods", "The Helm",
                         "Crystal Camp", "Outfitter", "The Den", "The Grotto",
                         "Forest Village", "Shadow Pylon"];

        for(var i = 0; i < cities.length; i++){
            cities[i]._index = cityOrder.indexOf(cities[i]);
        }

        cities.sort(function compareCities(a, b){
            return a._index - b._index;
        });
        
        //for(var i = 0; i < cities.length; i++){
        //    delete cities[i]._index;
        //}


        return cities;
    }


    function extractUnitData(hgJson) {

        // Build an array of objects from the JSON data holding all units.
        var rawCards = hgJson.data.CARDLIST.CARD;
        var cards = [];
        var rarities = {
            0: "Common",
            1: "Uncommon",
            2: "Rare",
            3: "Ultra Rare",
            4: "Legendary"
        };

        // Iterate over the raw unit data. Omit the first "unknown" placeholder unit.
        for (var i = 1 ; i < rawCards.length ; i++) {
            var rawCard = rawCards[i];
            var attributes = rawCard.attributes;
            var homeActions = [];
            var battleActions = [];
            var types = [];
            var searchText = "";

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
                searchText += "!action " + actionValue + " " + actionType + " ";
            }

            // Populate types array. Raw types can be an array or an object.
            if ($.isArray(rawCard.TYPE)) {
                for (var k = 0 ; k < rawCard.TYPE.length ; k++) {
                    types.push(rawCard.TYPE[k]["#text"]);
                }
            } else if (typeof(rawCard.TYPE) === "object") {
                types.push(rawCard.TYPE["#text"]);
            }
            
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
            };

            searchText += ["!name", card.name,
                          card.types.join(" "),
                          card.cost.gold ? ["!cost",
                                               card.cost.gold,
                                               "gold"].join(" ") : "",
                          card.cost.crystal ? ["!cost",
                                               card.cost.crystal,
                                               "crystal"].join(" ") : "",
                          card.cost.wood ? ["!cost",
                                               card.cost.wood,
                                               "wood"].join(" ") : "",
                          "!rarity", card.rarity,
                          "!edition", card.edition,
                          ].join(" ");
            card.searchText = searchText;
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

    var unitTemplateScript = $("#unit-card").html();
    var unitTemplate = Handlebars.compile(unitTemplateScript);
    var cityTemplateScript = $("#city-button").html();
    var cityTemplate = Handlebars.compile(cityTemplateScript);
    Handlebars.registerHelper('toUpperCase', function(str) {
        return str.toUpperCase();
    });
    
    function populateUnits(units) {

        for (var i = 0 ; i < units.length ; i++) {
            var unit = units[i];
            unit["cache"] = unit["cache"] || unitTemplate(unit);
             $(".units").append(unit["cache"]);
        }
        $(".unit-sprite img").on("error abort", function() {
            this.src="images/outline.png";
        });
    }
    
    function populateCities(cities) {

        for (var j = 0 ; j < cities.length ; j++) {
            var city = cities[j];
            city["cache"] = city["cache"] || cityTemplate(city);
            $(".cities").append(city["cache"]);
        }
        $('.city').on('click', function() {
            $(this).toggleClass('button-primary');
            activeCities = getActiveCities();
            $('.units').empty();
            populateUnits(filterUnits(unitLibrary, activeCities));
            searchFilter();
        });
    }
    
  
    $("#search").on("keyup", searchFilter);

    function searchFilter() {
        var values = $("#search").val().toLowerCase().split(",");
        console.log(values);

        $(".units .unit").each(function() {
            var matches = [];
            var searchText = $(this).data("searchText").toLowerCase();
            
            for (var i = 0 ; i < values.length ; i++) {
                matches.push(searchText.search(values[i]) > -1);
            }

            if(matches.indexOf(false) > -1) {
                $(this).hide();
            }
            else {
                $(this).show();
            }
        });
    }

    $(".buttons i").on("click", function() {
        $(".search-instructions").toggle();
    });

    // Go time.
    getUnits();
});
