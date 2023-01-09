import * as limosa from "./geocoder.js";

// Esplanade Godefroy 1, 6830 Bouillon, Belgique

test("Global geocode", async () => {
  const run = runs.mainSample;
  const result = await limosa.locate(run.input, run.config);

  console.log(JSON.stringify(result, null, 2));
}, 60000);

const runs = {
  mainSample: {
    input: {
      house: "14",
      street: "Quai des Saulx",
      locality: "Bouillon",
      postalCode: "6830",
      country: "Belgium"
    }
  },
  exactMatchInCity: {
    input: {
      street: ["Av. du Vert Chasseur 46"],
      postalCode: "1180",
      locality: ["Uccle"],
      country: ["Belgium"],
    }
  },
  houseNumberUnknown: {
    input: {
      street: ["60A Grand rue"], // street, first element needs to contain street name
      postalCode: "6850",
      locality: ["Carlsbourg"], // locality, district, city
      country: ["Belgium"], // country
    }
  },
  exactMatchInCountryside: {
    input: {
      street: ["40 Grand rue"], // street, first element needs to contain street name
      postalCode: "6850",
      locality: ["Carlsbourg"], // locality, district, city
      country: ["Belgium"], // country
    }
  },
  notTheExactCity: {
    input: {
      street: ["50 Avenue Franklin Roosevelt"],
      postalCode: "1050",
      country: ["Belgium"],
      locality: ["Ixelles"],
    }
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
