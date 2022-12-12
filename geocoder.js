import fetch from "node-fetch";
import * as fuzz from "fuzzball";
import { ofnBeConfig } from "./configs/ofnBe";

const PhotonProperties = [
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

function osmUuidToOsmElement(uuid) {
  const split = uuid.split("-");
  return {
    id: split[1],
    type: split[0].toUpperCase(),
  };
}

async function get(url, urlSearchParams) {
  const requestUrl = url + "?" + urlSearchParams.toString();
  const request = await fetch(requestUrl);
  const response = await request.json();
  return response;
}

// give services (their url), mapping configurations
export class Geocoder {
  constructor(serviceConfig, profile) {
    this.photonUrl = serviceConfig.photon.url;
    this.profile = profile;
  }

  async makePhotonRequest(requestAddressComponents, config) {
    const searchParams = new URLSearchParams({
      q: requestAddressComponents.join(", "),
    });

    if (config?.layers != null) {
      config.layers.forEach((l) => searchParams.append("layer", l));
    }

    if (config?.limit != null) searchParams.append("limit", config.limit);

    return await get(this.photonUrl, searchParams);
  }

  async makeNominatimDetailsRequest(q) {
    q.format = "json";
    return await get(this.nominatimUrl + "/details", new URLSearchParams(q));
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

    const mostCommonIds = arrays.reduce((p, c) =>
      p.filter((e) => c.includes(e))
    );

    const result = {
      electedMatch: exactMatch,
    };

    if (mostCommonIds.length == 1)
      result.electedOsmElement = osmUuidToOsmElement(mostCommonIds[0]);

    if (
      mostCommonIds.length > 1 &&
      mostCommonIds.filter((i) => i.startsWith("w")).length > 0
    )
      result.electedOsmElement = osmUuidToOsmElement(
        mostCommonIds.filter((i) => i.startsWith("w"))[0]
      );

    return result;
  }

  async makeAndExecuteRuns(initialData, currentTactics) {
    const runs = [];

    // TODO get strategy tactics
    for (const tactic of currentTactics) {
      const searchComponents = tactic.searchQuery(initialData);

      const response = await this.makePhotonRequest(searchComponents, {
        layers: tactic.layers,
        limit: tactic.limit,
      });

      // TODO refactor
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
        });
      } else {
        e.keys.push(m.key);
        e.uuids.push(m.uuid);
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
              uuid:
                f.properties.osm_type.toLowerCase() + "-" + f.properties.osm_id,
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

export { ofnBeConfig }