import { OpenLocationCode } from "open-location-code";

/*
"road": "Avenue du Vert Chasseur - Groene Jagerslaan",
"neighbourhood": "Vert Chasseur - Groene Jager",
"town": "Uccle - Ukkel",
"county": "Brussel-Hoofdstad - Bruxelles-Capitale",
"region": "Région de Bruxelles-Capitale - Brussels Hoofdstedelijk Gewest",
"ISO3166-2-lvl4": "BE-BRU",
"postcode": "1180",
"country": "België / Belgique / Belgien",
"country_code": "be"
*/

// osmAddressSkip

const osmPlaces = [
    "road",
    "neighbourhood",
    "town",
    "country",
    "region",
    "postcode",
    "country"
]

// max 5 layers search : country, region, locality, street, house
// determine lowest valid feature
// from these results, we can retrieve osm id for some photon layers
// one lookup to nominatim with all osm ids, there might be more and some new layers

// so we now photon type, osm type 
// propagate children info down wards
// skip some layers I don't want

// find parents for each feature

const places = [
    {
        name: "Grand rue",
        parents: [
            "be/wa/wlx/neufchâteau/paliseul/carlsbourg"
        ],
        osm: {
          fullId: "R43828"
        },
        nominatim: {
          id: ""  
        },
        photon: {
          
        },
        center: {
            // json feature
        },
        geometry: {
            // json feature
        },
        translations: {

        }
    },
    {

    }
]

const result =  {
    photonHierarchy: ["België / Belgique / Belgien", "Luxembourg", "Neufchâteau", "Paliseul", "Carlsbourg", "Grand rue", "40"]
}

test("Plus codes", () => {

    const ol = new OpenLocationCode()
    const re = ol.encode(53.4979534,-6.7046385)
    const re1 = ol.encode(53.5825956,-6.6246486)
    const re2 = ol.encode(53.54026225,-6.665005442449422)
    console.log(re)
    console.log(re1)
    console.log(re2)
});
