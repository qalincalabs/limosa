# Limosa [alpha]

Geolocation based on Photon (Komoot) through Open Street Map. The geocoder goes through strategy-defined successive layers (country, locality, street, housenumber), makes Photon requests based on those and then elect a match among all Photon results.

> Strict ! For instance, if a housenumber doesn't exist in OSM, the geocoder will only output the street.

## How to

For a defined strategy (for instance: [OFN-BE](https://github.com/qalincalabs/limosa/blob/main/configs/ofnBe.js)), this is the input of the geocoder and its output (you can then use Nominatim to get extra info over the OSM element like [over here](https://github.com/qalincalabs/limosa/blob/main/configs/ofnBe.test.js#L8)). The input is user defined, you define in the strategy how to map to a Photon search request.

https://github.com/qalincalabs/limosa/blob/eb44acc7d17d046db0c07ca33e2091301e2bf294/configs/ofnBe.test.js#L100-L127

## Strategies

* [OFN BE](/configs/ofnBe.js) -> input/output [samples](https://github.com/qalincalabs/limosa/blob/main/configs/ofnBe.test.js#L45)
