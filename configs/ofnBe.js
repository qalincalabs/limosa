export const config = {
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

const LimosaOfnBeConfig = () => {};
export default LimosaOfnBeConfig;
