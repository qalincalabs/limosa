import * as limosa from "./geocoder.js";

test("Geocode sample", async () => {
  const run = runs.mainSample;
  const photonResult = await limosa.photonLocate(run.input, run.config);
  console.log(JSON.stringify(photonResult, null, 2));

  const uuids = limosa.extractOsmUuids(photonResult);
  console.log(uuids);

  const nominatimResult = await limosa.nominatimLookup(
    { osm_ids: uuids },
    {
      addressdetails: 1,
      namedetails: 1,
      extratags: 1,
    });
  console.log(JSON.stringify(nominatimResult, null, 2));
}, 60000);

test("Nominatim lookup", async () => {
  const nominatimResult = await limosa.nominatimLookup(
    { osm_ids: ["N9429754917", "N9429754918"] },
    {
      format: "geojson",
      addressdetails: 1,
      namedetails: 1,
      extratags: 1,
    }
  );

  console.log(JSON.stringify(nominatimResult, null, 2));
});

const runs = {
  mainSample: {
    input: {
      house: "14",
      street: "Quai des Saulx",
      locality: "Bouillon",
      postalCode: "6830",
      country: "Belgium",
    },
  },
  exactMatchInCity: {
    input: {
      street: ["Av. du Vert Chasseur 46"],
      postalCode: "1180",
      locality: ["Uccle"],
      country: ["Belgium"],
    },
  },
  houseNumberUnknown: {
    input: {
      street: ["60A Grand rue"], // street, first element needs to contain street name
      postalCode: "6850",
      locality: ["Carlsbourg"], // locality, district, city
      country: ["Belgium"], // country
    },
  },
  exactMatchInCountryside: {
    input: {
      street: ["40 Grand rue"], // street, first element needs to contain street name
      postalCode: "6850",
      locality: ["Carlsbourg"], // locality, district, city
      country: ["Belgium"], // country
    },
  },
  notTheExactCity: {
    input: {
      street: ["50 Avenue Franklin Roosevelt"],
      postalCode: "1050",
      country: ["Belgium"],
      locality: ["Ixelles"],
    },
  },
  fakeStreet: {
    input: {
      street: ["Av. des bons légumes"],
      postalCode: "1050",
      locality: ["Ixelles"],
      country: ["Belgium"],
    },
  },
  inAnotherCountryWithoutAStreet: {
    input: {
      house: ["Swainstown"],
      postalCode: "C15 YK80",
      locality: ["Kilmessan"],
      country: ["Ireland"],
    },
    config: {
      postalCodeLevel: "house",
    },
  },
};
