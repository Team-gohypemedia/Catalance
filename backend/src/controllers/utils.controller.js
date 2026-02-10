import { asyncHandler } from "../utils/async-handler.js";

const STATE_PROVIDER_API = "https://countriesnow.space/api/v0.1/countries/states";
const STATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STATE_CACHE_MAX_ENTRIES = 400;

const stateCache = new Map();

const COUNTRY_PROVIDER_ALIASES = {
  "Iran, Islamic Republic of": "Iran",
  "Korea, Republic of": "South Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Congo, The Democratic Republic of the": "Democratic Republic of the Congo",
  "Moldova, Republic of": "Moldova",
  "Russian Federation": "Russia",
  "Syrian Arab Republic": "Syria",
  "Lao People's Democratic Republic": "Laos",
  "Tanzania, United Republic of": "Tanzania",
  "Venezuela, Bolivarian Republic of": "Venezuela",
  "Bolivia, Plurinational State of": "Bolivia",
  "Taiwan, Province of China": "Taiwan",
  "Micronesia, Federated States of": "Micronesia",
  "Macedonia, The Former Yugoslav Republic of": "North Macedonia",
  "Holy See (Vatican City State)": "Vatican City",
  "Cote d'Ivoire": ["Cote d'Ivoire", "Ivory Coast"],
  "Brunei Darussalam": "Brunei",
  "Libyan Arab Jamahiriya": "Libya",
  "Viet Nam": "Vietnam",
};

const toNormalizedList = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

const readStateCache = (cacheKey) => {
  const entry = stateCache.get(cacheKey);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    stateCache.delete(cacheKey);
    return null;
  }

  return entry.states;
};

const writeStateCache = (cacheKey, states) => {
  stateCache.set(cacheKey, {
    states,
    expiresAt: Date.now() + STATE_CACHE_TTL_MS,
  });

  while (stateCache.size > STATE_CACHE_MAX_ENTRIES) {
    const oldestKey = stateCache.keys().next().value;
    if (!oldestKey) break;
    stateCache.delete(oldestKey);
  }
};

const buildCountryCandidates = (countryName) => {
  const candidates = [];
  const seen = new Set();

  const addCandidate = (value) => {
    const normalized = String(value || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    candidates.push(normalized);
  };

  addCandidate(countryName);

  const withoutParentheses = String(countryName || "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  addCandidate(withoutParentheses);

  if (String(countryName).includes(",")) {
    addCandidate(String(countryName).split(",")[0]);
  }

  const alias = COUNTRY_PROVIDER_ALIASES[countryName];
  if (Array.isArray(alias)) {
    alias.forEach(addCandidate);
  } else {
    addCandidate(alias);
  }

  return candidates;
};

const fetchStatesFromProvider = async (countryName) => {
  const response = await fetch(STATE_PROVIDER_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ country: countryName }),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`State provider failed with status ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  if (!payload || payload.error) {
    return [];
  }

  const rawStates = Array.isArray(payload?.data?.states) ? payload.data.states : [];
  return toNormalizedList(rawStates.map((entry) => entry?.name));
};

export const getMetadataHandler = asyncHandler(async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
        // Some sites return 403 to bots even with UA spoofing, but return HTML.
        // If status is 4xx/5xx, we might still try to read text if possible, but usually it's failure.
       if (response.status === 404) throw new Error("Page not found");
    }

    const html = await response.text();

    // Helper to extract content from meta tags
    const getMetaContent = (propName) => {
        const regex = new RegExp(
            `<meta[^>]+(?:property|name)=["']${propName}["'][^>]+content=["']([^"']+)["']|` +
            `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propName}["']`, 
            'i'
        );
        const match = html.match(regex);
        return match ? (match[1] || match[2]) : null;
    };

    const image = getMetaContent('og:image') || 
                  getMetaContent('twitter:image') || 
                  getMetaContent('image');
                  
    const title = getMetaContent('og:title') || 
                  getMetaContent('twitter:title') || 
                  (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
                  
    const description = getMetaContent('og:description') || 
                        getMetaContent('twitter:description') || 
                        getMetaContent('description');

    return res.json({
      success: true,
      data: {
        image,
        title,
        description,
        url,
      },
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);
    // Don't fail hard, just return success: false so frontend can fallback
    return res.json({ 
        success: false, 
        error: error.message 
    });
  }
});

export const getStatesHandler = asyncHandler(async (req, res) => {
  const country = String(req.query.country || "").trim();
  if (!country) {
    return res.status(400).json({ success: false, error: "Country is required" });
  }

  const cacheKey = country.toLowerCase();
  const cachedStates = readStateCache(cacheKey);
  if (cachedStates !== null) {
    return res.json({
      success: true,
      data: {
        country,
        states: cachedStates,
      },
    });
  }

  const candidates = buildCountryCandidates(country);
  let states = [];

  for (const candidate of candidates) {
    try {
      const candidateStates = await fetchStatesFromProvider(candidate);
      if (candidateStates.length > 0) {
        states = candidateStates;
        break;
      }
    } catch (error) {
      console.error(`State lookup failed for "${candidate}":`, error);
    }
  }

  writeStateCache(cacheKey, states);

  return res.json({
    success: true,
    data: {
      country,
      states,
    },
  });
});
