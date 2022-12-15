import * as limosa from "../geocoder.js";

// limosa locate

// Esplanade Godefroy 1, 6830 Bouillon, Belgique
test("Geocode sample", async () => {
  const result = await limosa.locate({
    house: "14",
    street: "Quai des Saulx",
    locality: "Bouillon",
    postalCode: "6830",
    country: "Belgium",
  });

  console.log(result);

  // to get extra info, call nominatim
  const nominatimQuery = {
    osmid: result.electedOsmElement.id,
    osmtype: result.electedOsmElement.type,
    addressdetails: 1,
    namedetails: 1,
    tagdetails: 1,
  };

  const nominatimResult = await limosa.nominatimGetDetails(nominatimQuery);

  console.log(nominatimResult)
}, 60000);

test("Global geocode", async () => {
  const run = runs.exactMatchInCity;
  const config = Object.assign({ untilLevel: "house" }, run.config);
  const result = await limosa.locate(run.input, config);

  console.log(result);
}, 60000);

const runs = {
  exactMatchInCity: {
    input: {
      street: ["Av. du Vert Chasseur 46"],
      postalCode: "1180",
      locality: ["Uccle"],
      country: ["Belgium"],
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
      street: ["60A Grand rue"], // street, first element needs to contain street name
      postalCode: "6850",
      locality: ["Carlsbourg"], // locality, district, city
      country: ["Belgium"], // country
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
      street: ["40 Grand rue"], // street, first element needs to contain street name
      postalCode: "6850",
      locality: ["Carlsbourg"], // locality, district, city
      country: ["Belgium"], // country
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
      street: ["50 Avenue Franklin Roosevelt"],
      postalCode: "1050",
      country: ["Belgium"],
      locality: ["Ixelles"],
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
      street: ["Av. des bons légumes"],
      postalCode: "1050",
      locality: ["Ixelles"],
      country: ["Belgium"],
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
      house: ["Swainstown"],
      postalCode: "C15 YK80",
      locality: ["Kilmessan"],
      country: ["Ireland"],
    },
    config: {
      postalCodeLevel: "house",
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

function logWithFunctionCode(obj) {
  console.log(
    JSON.stringify(
      obj,
      function (_key, val) {
        if (typeof val === "function") {
          return val + ""; // implicitly `toString` it
        }
        return val;
      },
      2
    )
  );
}
