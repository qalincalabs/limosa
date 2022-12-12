import fetch from "node-fetch";

async function get(url, urlSearchParams) {
  const requestUrl = url + "?" + urlSearchParams.toString();
  const request = await fetch(requestUrl);
  const response = await request.json();
  return response;
}

export async function photonSearch(query, config) {
    const searchParams = new URLSearchParams({
      q: query.addressTags.join(", "),
    });

    if (config?.layers != null) {
      query.layers.forEach((l) => searchParams.append("layer", l));
    }

    if (query?.limit != null) searchParams.append("limit", query.limit);

    return await get(config.url, searchParams);
  }

  export async function nominatimGetDetails(query, config) {
    const url = config?.url ?? "https://nominatim.openstreetmap.org"
    query.format = "json";
    return await get(url + "/details", new URLSearchParams(query));
  }
