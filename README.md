# Limosa [alpha]

Address geolocation javascript library on top of Open Street Map (OSM) open source public APIs : [Photon](https://github.com/komoot/photon) (Komoot) for searching, [Nominatim](https://github.com/osm-search/Nominatim) for decorating.

> Important: Since Photon and Nominatim are free to use please be fair and avoid excessive requests.

Define an address (house, street, locality, postal code, region, country). Limosa then query Photon successive layers and compute a best match, get the exact place (if possible) and places above that (such as country, locality).

> Strict ! For instance, if a housenumber doesn't exist in OSM, the geocoder will only output the street.

## Usage

```javascript
import * as limosa from "@qalincalabs/limosa";

const photonResult = await limosa.photonLocate({
  house: "14",
  street: "Quai des Saulx",
  locality: "Bouillon",
  postalCode: "6830",
  country: "Belgium"
});

const uuids = limosa.extractOsmUuids(photonResult)
const nominatimResult = await limosa.nominatimLookup(
  { osm_ids: uuids },
  //{ format: "jsonv2", addressdetails: 1, namedetails: 1, extratags: 1 }
);

/*
photonResult is
{
  "match": {
    "countrycode": "BE",
    "state": "Luxembourg",
    "county": "Neufchâteau",
    "city": "Bouillon",
    "district": "Bouillon",
    "postcode": "6830",
    "street": "Quai des Saulx",
    "housenumber": "14"
  },
  "exactFeature": {
    "geometry": {
      "coordinates": [
        5.069359068004883,
        49.7938062
      ],
      "type": "Point"
    },
    "type": "Feature",
    "properties": {
      "osm_id": 422861107,
      "extent": [
        5.069283,
        49.7938544,
        5.0694352,
        49.7937584
      ],
      "country": "België / Belgique / Belgien",
      "city": "Bouillon",
      "countrycode": "BE",
      "postcode": "6830",
      "county": "Neufchâteau",
      "type": "house",
      "osm_type": "W",
      "osm_key": "tourism",
      "housenumber": "14",
      "street": "Quai des Saulx",
      "district": "Bouillon",
      "osm_value": "attraction",
      "name": "Archéoscope Godefroid de Bouillon",
      "state": "Luxembourg"
    }
  },
  "upperFeatures": [
    // ...
  ]
}
*/

```

## TODOs

* When can't find exactFeature, try replacing locality with result first upperFeature city (for Belgium)
* A place (like a shop) without a street number isn't exactly located
* Plug with https://github.com/openvenues/libpostal (need to find a public API)

## Custom geocoder [ON HOLD]

> The geocoder started with this but it's now put on the side

### Strategies

* [OFN BE](/configs/ofnBe.js) -> input/output [samples](https://github.com/qalincalabs/limosa/blob/main/configs/ofnBe.test.js#L20)

### How to

```javascript
import { Geocoder, ofnBeProfile, nominatimGetDetails } from "@qalincalabs/limosa";

const geocoder = new Geocoder(ofnBeProfile); // replace ofnBeProfile with your own defined profile

// the input has your address structure
const result = await geocoder.locate({
  address1: "Grand rue 40",
  country_id: 29,
  country_name: "Belgium",
  zipcode: "6850",
  city: "Carlsbourg",
});

/*
result is
{
  electedMatch: {
    countrycode: "BE",
    state: "Luxembourg",
    county: "Neufchâteau",
    city: "Paliseul",
    district: "Carlsbourg",
    postcode: "6850",
    street: "Grand Rue",
    housenumber: "40",
  },
  electedOsmElement: {
    id: "890827177",
    type: "W",
  },
}
*/
```