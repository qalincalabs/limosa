import { Geocoder, ofnBeProfile, nominatimGetDetails } from "../geocoder.js";

test("Geocode OFN address - sample", async () => {
  const geocoder = new Geocoder(ofnBeProfile);
  const result = await geocoder.locate(runs.exactMatchInCountryside.input);

  const nominatimSearch = await nominatimGetDetails({
    namedetails: 1,
    extratags: 1,
    osmtype: result.electedOsmElement.type,
    osmid: result.electedOsmElement.id,
    addressdetails: 1,
  });

  console.log(JSON.stringify(result, null, 2));
  console.log(JSON.stringify(nominatimSearch, null, 2));
  //expect(1+2).toBe(3);
});

const runs = {
  exactMatchInCity: {
    input: {
      address1: "Av. du Vert Chasseur 46",
      address2: null, // TODO use later, not sure it is in use
      country_id: 29,
      country_name: "Belgium",
      zipcode: "1180",
      city: "Uccle",
      state_name: "RBC",
      state_id: 213,
    },
    output: {
      electedMatch: {
        countrycode: "BE",
        state: "Région de Bruxelles-Capitale - Brussels Hoofdstedelijk Gewest",
        county: "Brussel-Hoofdstad - Bruxelles-Capitale",
        city: "Uccle - Ukkel",
        postcode: "1180",
        street: "Avenue du Vert Chasseur - Groene Jagerslaan",
        housenumber: "46",
      },
      electedOsmElement: {
        id: "30355110",
        type: "W",
      },
    },
  },
  houseNumberUnknown: {
    input: {
      address1: "Grand rue 60A",
      address2: null, // TODO use later, not sure it is in use
      country_id: 29,
      country_name: "Belgium",
      zipcode: "6850",
      city: "Carlsbourg",
      state_name: "Luxembourg",
      state_id: 213,
    },
    output: {
      electedMatch: {
        countrycode: "BE",
        state: "Luxembourg",
        county: "Neufchâteau",
        city: "Paliseul",
        district: "Carlsbourg",
        postcode: "6850",
        street: "Grand Rue",
      },
      electedOsmElement: {
        id: "617274322",
        type: "W",
      },
    },
  },
  exactMatchInCountryside: {
    input: {
      address1: "Grand rue 40",
      address2: null, // TODO use later, not sure it is in use
      country_id: 29,
      country_name: "Belgium",
      zipcode: "6850",
      city: "Carlsbourg",
      state_name: "Luxembourg",
      state_id: 213,
    },
    output: {
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
    },
  },
  notTheExactCity: {
    input: {
      address1: "Avenue Franklin Roosevelt 50",
      address2: null,
      country_id: 29,
      country_name: "Belgium",
      zipcode: "1050",
      city: "Ixelles",
    },
    ouput: {
      electedMatch: {
        countrycode: "BE",
        state: "Région de Bruxelles-Capitale - Brussels Hoofdstedelijk Gewest",
        county: "Brussel-Hoofdstad - Bruxelles-Capitale",
        city: "Bruxelles - Brussel",
        district: "Bruxelles - Brussel",
        postcode: "1000",
        street: "Avenue Franklin Roosevelt - Franklin Rooseveltlaan",
        housenumber: "50",
      },
      electedOsmElement: {
        id: "9429754917",
        type: "N",
      },
    },
  },
  fakeStreet: {
    input: {
      address1: "Av. des bons légumes",
      address2: null,
      country_id: 29,
      country_name: "Belgium",
      zipcode: "1050",
      city: "Ixelles",
    },
    output: {
      electedMatch: {
        countrycode: "BE",
        state: "Région de Bruxelles-Capitale - Brussels Hoofdstedelijk Gewest",
        county: "Brussel-Hoofdstad - Bruxelles-Capitale",
        city: "Ixelles - Elsene",
      },
      electedOsmElement: {
        id: "58250",
        type: "R",
      },
    },
  },
  inAnotherCountryWithoutAStreet: {
    input: {
      address1: "Swainstown",
      address2: null,
      country_name: "Ireland",
      zipcode: "C15 YK80",
      city: "Kilmessan",
    },
    output: {
      electedMatch: {
        countrycode: "IE",
        county: "County Meath",
        city: "Kilmessan",
        district: "Kilmessan ED",
        postcode: "C15 YK80",
        street: "Swainstown",
      },
      electedOsmElement: {
        id: "10026781976",
        type: "N",
      },
    },
  },
};
