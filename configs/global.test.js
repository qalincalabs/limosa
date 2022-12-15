import { buildStrategy } from "./global.js";
import { Geocoder } from "../geocoder.js";

// limosa locate

test("Global geocode", async () => {
  // tell what level to reach
  const carlsbourg = {
    // house: ["40 Grand rue"], // house
    street: ["40 Grand rue"], // street, first element needs to contain street name
    locality: ["Carlsbourg", "6850"], // locality, district, city
    country: ["Belgium"], // country
  };

  const swainstownFarm = {
    house: ["Swainstown farm", "C15 YK80"],
    locality: ["Kilmessan"],
    region: ["Co. Meatch"], // county, state
    country: ["Ireland"],
  };

  const input = runs.notTheExactCity.input;
  const strategy = buildStrategy(input, { untilLevel: "house" });
  const geocoder = new Geocoder(strategy);

  const result = await geocoder.locate(input);

  console.log(result);

  //logWithFunctionCode(strategy)
}, 60000);

const runs = {
  exactMatchInCity: {
    input: {
      street: ["Av. du Vert Chasseur 46"],
      country: ["Belgium"],
      city: ["Uccle", "1180"],
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
      locality: ["Carlsbourg", "6850"], // locality, district, city
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
      locality: ["Carlsbourg", "6850"], // locality, district, city
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
      country: ["Belgium"],
      locality: ["1050", "Ixelles"],
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
      locality: ["Ixelles", "1050"],
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
      house: ["Swainstown", "C15 YK80"],
      country: ["Ireland"],
      locality: ["Kilmessan"],
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
