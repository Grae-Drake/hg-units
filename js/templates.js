Templates = {};

Templates.city = [
    '<button class="city" data-city-id="{{id}}">',
        '{{ name }}',
    '</button>'
].join("")

Templates.unit = [
    '<div class="unit" data-search-text="{{searchText}}">',
        '<div class="unit-top">',

            '<a target="_blank" href="',
                '{{#if compendiumId}}',
                  'http://www.heartshapedgames.com/forums/showthread.php?tid=826&pid={{compendiumId}}',
                '{{else}}',
                  'http://www.heartshapedgames.com/forums/showthread.php?tid=126',
                '{{/if}}">',
                '<div class="unit-sprite">',
                    '<img src="images/{{name}}.png">',
                '</div>',
            '</a>',

            '<div class="unit-top-text">',
                '<p class="unit-name"> {{ toUpperCase name }} </p>',
                '<p class="unit-types">',
                    '{{#each types }}{{this}} {{/each}}',
                '</p>',
                '<p class="unit-cost">',
                    '{{#if cost.gold }}{{ cost.gold }} Gold{{/if}}',
                    '{{#if cost.crystal}}{{ cost.crystal }} Crystal{{/if}}',
                    '{{#if cost.wood}}{{ cost.wood }} Wood{{/if}}',
                '</p>',
                '<p class="unit-rarity"> {{ rarity }} </p>',
            '</div>',

        '</div>',

        '<div class="unit-bottom">',

            '<div class="unit-back-row">',
                '<p class="unit-row-title">Back Row</p>',
                '{{#each homeActions}}',
                    '<p class="unit-action {{ this.type }}">',
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

        '</div>',
    '</div>',
].join("")