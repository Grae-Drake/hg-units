Templates = {};

Templates.city = [
    '<button class="city" data-city-id="{{id}}" tabindex="-1">',
        '{{ name }}',
    '</button>'
].join("")

Templates.unit = [
    '<div id="{{name}}" class="unit" data-search-text="{{searchText}}">',
        '<div class="unit-top">',

            '<a target="_blank" tabindex="-1" href="',
                '{{#if compendiumId}}',
                  'http://www.heartshapedgames.com/forums/showthread.php?tid=826&pid={{compendiumId}}',
                '{{else}}',
                  'http://www.heartshapedgames.com/forums/showthread.php?tid=126',
                '{{/if}}">',
                '<div class="unit-sprite">',
                    '<img src="images/{{toLowerCase name}}.png">',
                '</div>',
            '</a>',

            '<div class="unit-top-text">',
                '<p class="unit-name"> {{ toUpperCase name }} </p>',
                '<p class="unit-types">',
                    '{{#each types }}{{this}} {{/each}}',
                '</p>',
                '{{#if cost.gold}}',
                    '<div class="resource-icon gold-icon"></div>',
                '{{/if}}',
                '{{#if cost.crystal}}',
                    '<div class="resource-icon crystal-icon"></div>',
                '{{/if}}',
                '{{#if cost.wood}}',
                    '<div class="resource-icon wood-icon"></div>',
                '{{/if}}',                                
                '<p class="unit-cost">',
                    '{{#if cost.gold }}{{ cost.gold }} Gold {{/if}}',
                    '{{#if cost.crystal}}{{ cost.crystal }} Crystal {{/if}}',
                    '{{#if cost.wood}}{{ cost.wood }} Wood {{/if}}',
                '</p>',
                '<div>',
                    '<div class="rarity-icon {{toLowerCase rarity}}"></div>',
                    '<p class="unit-rarity"> {{ rarity }} </p>',
                '</div>',
            '</div>',

        '</div>',

        '<div class="unit-bottom">',

            '<div class="unit-back-row">',
                '<p class="unit-row-title">Back Row</p>',
                '{{#each homeActions}}',
                    '<p class="unit-action {{ this.type }}" title="{{this.description}}">',
                        '{{ this.value }} {{ toUpperCase this.type }}',
                    '</p>',
                '{{/each}}',
            '</div>',

            '<div class="unit-front-row">',
                '<p class="unit-row-title">Front Row</p>',
                '{{#each battleActions}}',
                    '<p class="unit-action {{ this.type }}" title="{{this.description}}"> {{ this.value }} {{ toUpperCase this.type }} </p>',
                '{{/each}}',
            '</div>',
            
            '<div class="unit-count">',
                '<span>Collection:</span>',
                '<i class="fa fa-plus"></i>',
                '<input type="number" min="0" max="99" value="{{collection}}">',
                '<i class="fa fa-minus"></i>',
            '</div>',

        '</div>',
    '</div>',
].join("")