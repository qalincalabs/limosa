# Limosa [alpha]

Geolocation based on Photon (Komoot) through Open Street Map. The geocoder goes through strategy-defined successive layers (country, locality, street, housenumber), makes Photon requests based on those and then elect a match among all Photon results.

> Strict ! For instance, if a housenumber doesn't exist in OSM, the geocoder will only output the street.

```javascript
import * as limosa from "@qalincalabs/limosa";
import { nominatimGetDetails } from "@qalincalabs/limosa";

const result = await limosa.locate({
  house: "14",
  street: "Quai des Saulx",
  locality: "Bouillon",
  postalCode: "6830",
  country: "Belgium"
});

/*
result is
  {
    electedMatch: {
      countrycode: 'BE',
      state: 'Luxembourg',
      county: 'Neufchâteau',
      city: 'Bouillon',
      district: 'Bouillon',
      postcode: '6830',
      street: 'Quai des Saulx',
      housenumber: '14'
    },
    electedOsmElement: { id: '422861107', type: 'W' }
  }
*/

// to get extra info, call nominatim
const nominatimQuery = {
  osmid: result.electedOsmElement.id,
  osmtype: result.electedOsmElement.type,
  addressdetails: 1,
  namedetails: 1,
  tagdetails: 1,
}

const nominatimResult = await nominatimGetDetails(nominatimQuery)
```

## TODOs

* Plug with https://github.com/openvenues/libpostal (need to find a public API)

## Custom geocoder

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