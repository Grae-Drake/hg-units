
var unitLibrary = [];
var cityLibrary = [];
$(document).ready(function() {

    // Get the data from Highgrounds git repo and populate results.
    var indexURL = 'https://raw.githubusercontent.com/highgrounds' +
                    '/HighgroundsAssets/master/data/1stEdition.xml';
    var hgData = $.get(indexURL, function() {

        unitLibrary = extractUnitData(parseHighgroundsXml(hgData));
        cityLibrary = extractCityData(parseHighgroundsXml(hgData));
        populateCities(cityLibrary, cityTemplate);
        populateUnits(unitLibrary, unitTemplate);
        $('#search').focus();
    });


    // Event handlers
    $('.cities').on('click', ".city", function() {
        $(this).toggleClass('button-primary');
        $('.units').empty();
        populateUnits(filterUnits(unitLibrary, getActiveCities()), unitTemplate);
        searchFilter();
    });

    $(".buttons i").on("click", function() {
        $(".search-instructions").toggle();
    });

    $("#search").on("keyup", searchFilter);

    $(document).on("keyup", function(e) {
        if (e.which === 191) {$('#search').focus().select();}
    });

    $('.units').on('change', '.unit-count input', function() {
        var $this = $(this);
        var unitName = $this.parents(".unit").attr('id');
        var newVal = $this.val() || 0;
        localStorage[unitName] = newVal;
        $this.val(newVal);
    });

    $('.units').on('click', '.unit-count .fa-plus', function() {
        var $this = $(this);
        currentValue = parseInt($this.siblings("input").val(), 10);
        $this.siblings("input").val(Math.min(currentValue + 1, 99));
        var unitName = $this.parents(".unit").attr('id');
        localStorage[unitName] = $this.siblings("input").val();
    });

    $('.units').on('click', '.unit-count .fa-minus', function() {
        var $this = $(this);
        currentValue = parseInt($this.siblings("input").val(), 10);
        $this.siblings("input").val(Math.max(currentValue - 1, 0));
        var unitName = $this.parents(".unit").attr('id');
        localStorage[unitName] = $this.siblings("input").val();
    });



    // Templating.
    var unitTemplateScript = Templates.unit;
    var unitTemplate = Handlebars.compile(unitTemplateScript);
    var cityTemplateString = Templates.city;
    var cityTemplate = Handlebars.compile(cityTemplateString);
    Handlebars.registerHelper('toUpperCase', function(str) {
        return str.toUpperCase();
    });
    Handlebars.registerHelper('toLowerCase', function(str) {
        return str.toLowerCase();
    });

});


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

    // Sort cities for friendly button order.
    var cityOrder = ["Titan Ridge", "Dwila", "Sacred Woods", "The Helm",
                     "Crystal Camp", "Outfitter", "The Den", "The Grotto",
                     "Forest Village", "Shadow Pylon"];

    for(var l = 0; l < cities.length; l++){
        cities[l]._index = cityOrder.indexOf(cities[l].name);
    }

    cities.sort(function compareCities(a, b){
        return a._index - b._index;
    });

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
                             action.type.indexOf("duoRainer#2") > -1 ? "duoRainer" :
                             action.type;

            target.push({
                "type": actionType,
                "value": actionValue,
                "description": actionData[actionType.toLowerCase()].description.replace('%0', actionValue),
                "icon": actionData[actionType.toLowerCase()].icon
            });

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
            "name": attributes.name.toLowerCase(),
            "cost": {"gold": parseInt(attributes.g, 10),
                     "crystal": parseInt(attributes.c, 10),
                     "wood": parseInt(attributes.w, 10)},
            "edition": attributes.edition,
            "id": attributes.id,
            "rarity": rarities[parseInt(attributes.rarity, 10)],
            "homeActions": homeActions,
            "battleActions": battleActions,
            "types": types,
            "compendiumId": unitCompendium[attributes.name] ? unitCompendium[attributes.name] : undefined
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
    if (activeButtons.length === 0) {
        return cityLibrary;
    }
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

    
function populateUnits(units, unitTemplate) {
    var unitNodes = [];
    for (var i = 0 ; i < units.length ; i++) {
        var unit = units[i];
        unit["collection"] = localStorage[unit.name] || 0;
        unit["cache"] = unit["cache"] || $(unitTemplate(unit));
        unitNodes.push(unit["cache"]);

    }
    
    $(".units").append(unitNodes);

    $(".unit-sprite img").on("error abort", function() {
        $(this).addClass("non-image");
        this.src="images/outline.png";
    });
}

    
function populateCities(cities, cityTemplate) {

    for (var j = 0 ; j < cities.length ; j++) {
        var city = cities[j];
        city["cache"] = city["cache"] || $(cityTemplate(city));
        $(".cities").append(city["cache"]);
    }
}


function searchFilter() {
    var values = $("#search").val().toLowerCase().split(",");

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
