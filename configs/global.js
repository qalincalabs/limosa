const layersMapping = {
  house: ["house"],
  street: ["street"],
  locality: ["locality", "district", "city"],
  region: ["county", "state"],
  country: ["country"],
};

const untilPropertyMapping = {
  house: "housenumber",
  street: "street",
  locality: "district",
  region: "county",
  country: "country",
};

const levelsMajorToMinor = ["country", "region", "locality", "street", "house"];

export function addressLevelsAsc(input) {
  const sortedKeys = Object.keys(input).sort(
    (a, b) => levelsMajorToMinor.indexOf(a) - levelsMajorToMinor.indexOf(b)
  );
  return sortedKeys;
}

export function addressLevelsDesc(input) {
  return addressLevelsAsc(input).reverse();
}

export function addressLevelsDecreasing(input) {
  const sortedKeys = Object.keys(input).sort(
    (a, b) => levelsMajorToMinor.indexOf(a) - levelsMajorToMinor.indexOf(b)
  );
  return sortedKeys;
}

export function addressTagsForSpecificLevel(input, level) {
  const slicedKeys = addressLevelsDesc(input).filter(
    (k) => levelsMajorToMinor.indexOf(level) >= levelsMajorToMinor.indexOf(k)
  );
  const tags = slicedKeys.map((k) => input[k]).flat();
  return tags;
}

export function buildStrategy(input, config) {
  // TODO : a bit of a hack
  if (input[config.untilLevel] == null) input[config.untilLevel] = [];

  const strategy = {
    key: "default",
    validationThreshold: 80,
    skipBreakingAtLayers: ["street"],
  };

  const tactics = [];

  for (const level of addressLevelsDecreasing(input)) {
    const layers = layersMapping[level];
    const untilProperty = untilPropertyMapping[level];

    const tactic = {
      key: "global_" + level,
      layers: layers,
      untilProperty: untilProperty,
      searchQuery: (input) => {
        return addressTagsForSpecificLevel(input, level);
      },
    };

    if (level == "country") {
      tactic.postTransform = (input, features) => {
        // If a unique country is found, replace input country name with this one
        if (features?.length == 1)
          input.country = [features[0].properties.country];
      };
    }

    if (["house", "street"].includes(level) && input.street?.[0] != null) {
      tactic.validateAgainst = (input) => {
        return {
          street: input.street[0],
        };
      };
    }

    tactics.push(tactic);
  }

  strategy.tactics = tactics.map((t) => t.key);

  return {
    properties: [
      "countrycode",
      "state",
      "county",
      "city",
      "district",
      "postcode",
      "street",
      "housenumber",
    ],
    selectStrategy: (input) => {
      return "default";
    },
    strategies: [strategy],
    tactics: tactics,
  };
}

export const globalProfile = {
  properties: [
    "countrycode",
    "state",
    "county",
    "city",
    "district",
    "postcode",
    "street",
    "housenumber",
  ],
  selectStrategy: (input) => {
    if (input.country_name == "Belgium") return "ofn-be";
    else return "default";
  },
  strategies: [
    // Strict
    // For instance, if the house number is not in OSM, the house number won't be guessed
    {
      key: "ofn-be",
      validationThreshold: 80,
      preTransform: (input) => {
        if (input.country_name == "Belgium")
          input.country_name = "België / Belgique / Belgien";
      },
      tactics: ["ofn-be-locality", "ofn-be-street", "ofn-be-house"],
      skipBreakingAtLayers: ["street"], // some places don't have a street, let's not be affected by this
    },
    {
      key: "default",
      validationThreshold: 80,
      tactics: [
        "ofn-be-country",
        "ofn-be-locality",
        "ofn-be-street",
        "ofn-be-house",
      ],
      skipBreakingAtLayers: ["street"],
    },
  ],
  tactics: [
    {
      key: "ofn-be-house",
      layers: ["house"],
      untilProperty: "housenumber",
      searchQuery: (input) => {
        return [input.address1, input.zipcode, input.city, input.country_name];
      },
      // string fuzz validation (strategy validationThreshold as minimum to achieve)
      validateAgainst: (input) => {
        return {
          street: input.address1,
        };
      },
    },
    {
      key: "ofn-be-street",
      layers: ["street"],
      untilProperty: "street",
      searchQuery: (input) => {
        return [input.address1, input.zipcode, input.city, input.country_name];
      },
      validateAgainst: (input) => {
        return {
          street: input.address1,
        };
      },
    },
    {
      key: "ofn-be-locality",
      layers: ["district", "city"],
      untilProperty: "city",
      searchQuery: (input) => {
        return [input.city, input.country_name];
      },
    },
    {
      key: "ofn-be-country",
      layers: ["country"],
      untilProperty: "countrycode",
      searchQuery: (input) => {
        return [input.country_name];
      },
      postTransform: (input, features) => {
        // If a unique country is found, replace input country name with this one
        if (features?.length == 1)
          input.country_name = features[0].properties.country;
      },
    },
  ],
};
