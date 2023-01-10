import * as fuzz from "fuzzball";
import { ofnBeProfile } from "./configs/ofnBe";
import { photonSearch, nominatimGetDetails } from "./framework.js";

// TODO result features was transformed
// don't forget attribution

// limosa levels
// photon levels

// use nominatim lookup and add photon / limosa info
// use open cage : https://github.com/fragaria/address-formatter

// formatted address
// rename bounding box to extent
// replace lat long with location
// add geometry if asked (geojson)
// plus code -> might be a way to insure uniqueness -> only for a house (not for area ...)

const result = {
  exactPlace: {
    relId: "",
  },
  lowestLevelPlace: {
    relId: "",
  },
  places: [
    {
      relId: "places/be",
      ids: [],
      name: "Belgique / ...",
      osm: {},
      photon: {
        layer: "country",
      },
    },
    {
      relId: "photon/be/districts/county_name",
      ids: [],
      name: "Belgique / ...",
      osm: {},
      photon: {
        layer: "country",
      },
    },
  ],
};

const myResult = {
  place: {},

  inPlaces: [{}, {}],

  exactPlace: {},
  lowestPlace: {},
  places: [
    {
      // nominatim output
      // formattedAddress
      openCage: {},
      photon: {
        district: "",
        // the specific photon properties
        // + type -> level
        // + name
      },
      limosa: {
        level: "locality",
      },
    },
  ],
};

const photonProperties = [
  "country",
  "countrycode",
  "state",
  "county",
  "city",
  "district",
  "locality",
  "postcode",
  "street",
  "housenumber",
];

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
  country: "countrycode",
};

const levelsMajorToMinor = ["country", "region", "locality", "street", "house"];

/*
function osmUuidToOsmElement(uuid) {
  const split = uuid.split("-");
  return {
    id: split[1],
    type: split[0].toUpperCase(),
  };
}
*/

export async function locate(input, config) {

  const defaultConfig = {
    untilLevel: "house"
  }

  config = Object.assign(defaultConfig, config);

  // TODO a bit of a hack to build a strategy per
  const strategy = buildStrategy(input, config);
  const geocoder = new Geocoder(strategy);
  return await geocoder.locate(input);
}

function addressLevelsAsc(input) {
  const sortedKeys = Object.keys(input).sort(
    (a, b) => levelsMajorToMinor.indexOf(a) - levelsMajorToMinor.indexOf(b)
  );
  return sortedKeys;
}

function addressLevelsDesc(input) {
  return addressLevelsAsc(input).reverse();
}

function addressLevelsDecreasing(input) {
  const sortedKeys = Object.keys(input).sort(
    (a, b) => levelsMajorToMinor.indexOf(a) - levelsMajorToMinor.indexOf(b)
  );
  return sortedKeys;
}

function addressTagsForSpecificLevel(input, level) {
  const slicedKeys = addressLevelsDesc(input).filter(
    (k) => levelsMajorToMinor.indexOf(level) >= levelsMajorToMinor.indexOf(k)
  );
  const tags = slicedKeys.map((k) => input[k]).flat();
  return tags;
}

// TODO input variable confusing with anonymous function input parameter
export function buildStrategy(input, config) {
  // TODO : a bit of a hack

  const postalCode = input.postalCode;
  delete input.postalCode;

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value) == false) input[key] = [value];
  }

  if (config?.untilLevel != null && input[config.untilLevel] == null)
    input[config.untilLevel] = [];

  const postalCodeLevel = config?.postalCodeLevel ?? "locality";

  if (postalCode != null) {
    if (input[postalCodeLevel] == null) input[postalCodeLevel] = [];
    input[postalCodeLevel].push(postalCode);
  }

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

// give services (their url), mapping configurations
export class Geocoder {
  constructor(profile, config) {
    this.photonUrl = config?.photon?.url ?? "https://photon.komoot.io/api";
    this.profile = profile;
  }

  async locate(input) {
    const properties = this.profile.properties;
    const selectedStrategy = this.profile.selectStrategy(input);

    const currentStrategy = this.profile.strategies.find(
      (s) => s.key == selectedStrategy
    );

    if (currentStrategy.preTransform) currentStrategy.preTransform(input);

    const currentTactics = currentStrategy.tactics.map((t1) =>
      this.profile.tactics.find((t2) => t2.key == t1)
    );

    for (const t of currentTactics) {
      t.properties = properties.slice(
        0,
        properties.indexOf(t.untilProperty) + 1
      );
    }

    const runs = await this.makeAndExecuteRuns(input, currentTactics);
    const matrix = this.getPropertyValues(runs, input, currentStrategy);

    let groupedMatrix = this.getGroupedPropertyValues(
      matrix,
      currentTactics.map((t) => t.key)
    );

    const exactMatch = {};
    const previousMatch = [];

    for (const p of properties) {
      const myTactics = currentTactics
        .filter((t) => t.properties.includes(p))
        // skip tactics where run didn't give any result ...
        .filter(
          (t) =>
            runs.find((r) => r.features?.length == 0 && r.tactic.key == t) ==
            false
        )
        .map((t) => t.key);

      const bestMatches = groupedMatrix.filter(
        (g) => g.property == p && myTactics.every((t) => g.keys.includes(t))
      );

      let bestMatch = null;

      for (const best of bestMatches) {
        if (
          previousMatch.every((p) =>
            best.uuids.some((u) => p.uuids.includes(u))
          )
        ) {
          bestMatch = best;
          break;
        }
      }

      if (bestMatch != null) {
        exactMatch[p] = bestMatch.value;
        previousMatch.push(bestMatch);
      }
    }

    const arrays = previousMatch.map((p) => p.uuids);

    if (arrays.length == 0) return;

    for (const pp of previousMatch) {
      let indexToKeep = pp.isExactTypes.reduce(
        (acc, curr, index) => (curr ? [...acc, index] : acc),
        []
      );

      const indexToKeepNodes = indexToKeep.filter((ik) =>
        pp.uuids[ik].startsWith("N") // node has priority over way
      );

      if (pp.property == "housenumber" && indexToKeepNodes.length == 1) {
        indexToKeep = indexToKeepNodes;
      }

      const singleIndexToKeep = indexToKeep[0];

      if (indexToKeep.length == 1) {
        pp.exactType = pp.exactTypes[singleIndexToKeep];
        pp.key = pp.keys[singleIndexToKeep];
        pp.uuid = pp.uuids[singleIndexToKeep];
      }

      delete pp.isExactTypes;
      delete pp.uniqueKeys;
      delete pp.exactTypes;
      delete pp.keys;
      delete pp.uuids;
    }

    const features = runs.map((r) => r.features).flat();

    // reset feature as it was at origin
    features.forEach(f => {
      if(f.properties.type == "house")
        return

      delete f.properties[f.properties.type]
    })


    for (const pp of previousMatch.filter((p) => p.uuid != null)) {
      pp.feature = features.find(
        (f) =>
          f.properties.osm_id == pp.uuid.slice(1) &&
          f.properties.osm_type == pp.uuid[0]
      );
    }

    const levelToAchieve = "global_house";

    const result = {};

    result.match = exactMatch;
    const exactFeatureIndex = previousMatch.findIndex(
      (p) => p.key == levelToAchieve && p.feature != null
    );

    if (exactFeatureIndex >= 0) {
      result.exactFeature = previousMatch[exactFeatureIndex].feature;
      delete previousMatch[exactFeatureIndex];
    }

    result.upperFeatures = previousMatch
      .filter((p) => p.feature != null)
      .map((p) => p.feature)
      .reverse();

    return result;
  }

  async makeAndExecuteRuns(initialData, currentTactics) {
    const runs = [];

    // TODO get strategy tactics
    for (const tactic of currentTactics) {
      const addressTags = tactic.searchQuery(initialData);

      const response = await photonSearch(
        {
          addressTags: addressTags,
          layers: tactic.layers,
          limit: tactic.limit,
        },
        {
          url: this.photonUrl,
        }
      );

      // TODO this is transformin photon response
      const features = response.features.map((f) => {
        if (f.properties.type == "house") return f;
        f.properties[f.properties.type] = f.properties.name;
        return f;
      });

      if (tactic.postTransform) tactic.postTransform(initialData, features);

      runs.push({
        tactic: tactic,
        features: features,
      });
    }
    return runs;
  }

  getGroupedPropertyValues(matrix, tactics) {
    let groupedMatrix = [];
    const sortedMatrix = matrix.sort(
      (a, b) => tactics.indexOf(b.key) - tactics.indexOf(a.key)
    );

    for (const m of sortedMatrix) {
      const e = groupedMatrix.find(
        (g) => g.value == m.value && g.property == m.property
      );
      if (e == null) {
        groupedMatrix.push({
          value: m.value,
          property: m.property,
          keys: [m.key],
          uuids: [m.uuid],
          exactTypes: [m.exactType],
          isExactTypes: [m.isExactType],
        });
      } else {
        e.keys.push(m.key);
        e.uuids.push(m.uuid);
        e.exactTypes.push(m.exactType);
        e.isExactTypes.push(m.isExactType);
      }
    }

    groupedMatrix.forEach((g) => (g.uniqueKeys = [...new Set(g.keys)]));

    const group = groupedMatrix.sort((a, b) => {
      if (a.uniqueKeys.length == b.uniqueKeys.length) {
        // prefer values obtained more precise layers
        // TODO be recursive
        if (a.keys == b.keys && a.uniqueKeys > 1 && b.uniqueKeys > 1)
          return (
            tactics.indexOf(b.uniqueKeys[1]) - tactics.indexOf(a.uniqueKeys[1])
          );
        return (
          tactics.indexOf(b.uniqueKeys[0]) - tactics.indexOf(a.uniqueKeys[0])
        );
      }
      return b.uniqueKeys.length - a.uniqueKeys.length;
    });

    return group;
  }

  getPropertyValues(runs, input, strategy) {
    const matrix = [];
    const threshold = strategy.validationThreshold; // should remove house number

    for (const r of runs) {
      let atLeastOne = false;
      for (const f of r.features) {
        if (r.tactic.validateAgainst != null) {
          const against = r.tactic.validateAgainst(input);

          let leave = false;

          for (const againstProp of Object.keys(against)) {
            if (f.properties[againstProp] == null) continue;
            // OSM seperates name by - for multiple languages
            const scores = f.properties[againstProp]
              .split(" - ")
              .map((v) => fuzz.ratio(v, against[againstProp]));
            const score = Math.max.apply(null, scores);

            if (score < threshold) leave = true;
          }

          if (leave == true) continue;
        }

        atLeastOne = true;

        for (const p of r.tactic.properties) {
          if (f.properties[p] != null)
            matrix.push({
              key: r.tactic.key,
              property: p,
              value: f.properties[p],
              uuid: f.properties.osm_type + f.properties.osm_id,
              exactType: f.properties.type,
              isExactType:
                f.properties.type == p ||
                (p == "housenumber" && f.properties.type == "house") || // TODO house number is a pain
                (p == "countrycode" && f.properties.type == "country"), // TODO country is a pain
            });
        }
      }

      if (
        atLeastOne == false &&
        r.tactic.layers.some((l) =>
          strategy.skipBreakingAtLayers.includes(l)
        ) == false
      )
        break;
    }
    return matrix;
  }
}

export { ofnBeProfile, nominatimGetDetails };
