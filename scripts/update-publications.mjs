import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const {
  ZOTERO_LIBRARY_TYPE = 'user',
  ZOTERO_LIBRARY_ID = '12053584',
  ZOTERO_API_KEY,
  ZOTERO_COLLECTION_KEY = 'JY3HN4I2',
  ZOTERO_INCLUDE_SUBCOLLECTIONS = 'false',
  ZOTERO_LIMIT = '100',
  ZOTERO_OUTPUT_PATH = 'data/publications.json'
} = process.env;

const SUPPORTED_LIBRARY_TYPES = new Set(['user', 'group']);
const SKIPPED_ITEM_TYPES = new Set(['attachment', 'note', 'annotation']);

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
}

function getLibraryPath(libraryType, libraryId) {
  if (!SUPPORTED_LIBRARY_TYPES.has(libraryType)) {
    throw new Error('ZOTERO_LIBRARY_TYPE must be "user" or "group".');
  }

  const segment = libraryType === 'group' ? 'groups' : 'users';
  return `${segment}/${libraryId}`;
}

function shouldIncludeSubcollections() {
  return ['1', 'true', 'yes'].includes(ZOTERO_INCLUDE_SUBCOLLECTIONS.toLowerCase());
}

function normalizeDoi(doi) {
  return String(doi || '')
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .trim();
}

function getYear(date) {
  const match = String(date || '').match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : '';
}

function getCreatorName(creator) {
  if (creator.name) {
    return creator.name;
  }

  return [creator.firstName, creator.lastName].filter(Boolean).join(' ');
}

function getAuthors(creators = []) {
  return creators
    .filter(creator => ['author', 'inventor', 'presenter'].includes(creator.creatorType))
    .map(getCreatorName)
    .filter(Boolean)
    .join(', ');
}

function getVenue(data) {
  return data.publicationTitle ||
    data.conferenceName ||
    data.proceedingsTitle ||
    data.bookTitle ||
    data.university ||
    data.publisher ||
    '';
}

function getItemUrl(data) {
  if (data.url) {
    return data.url;
  }

  const doi = normalizeDoi(data.DOI);
  return doi ? `https://doi.org/${doi}` : '';
}

function mapZoteroItem(item) {
  const data = item.data || {};

  return {
    id: item.key,
    itemType: data.itemType || '',
    title: data.title || '',
    authors: getAuthors(data.creators),
    venue: getVenue(data),
    date: data.date || '',
    year: getYear(data.date),
    doi: normalizeDoi(data.DOI),
    url: getItemUrl(data),
    zoteroUrl: item.links?.alternate?.href || ''
  };
}

async function fetchZoteroJson(libraryPath, resourcePath, extraParams = {}) {
  const limit = Number.parseInt(ZOTERO_LIMIT, 10);
  const params = new URLSearchParams({
    format: 'json',
    include: 'data',
    limit: String(Number.isFinite(limit) ? limit : 100),
    ...extraParams
  });
  const url = `https://api.zotero.org/${libraryPath}/${resourcePath}?${params}`;
  const headers = {
    'Zotero-API-Version': '3'
  };

  if (ZOTERO_API_KEY) {
    headers['Zotero-API-Key'] = ZOTERO_API_KEY;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zotero API request failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function fetchPagedZoteroJson(libraryPath, resourcePath, extraParams = {}) {
  const limit = Number.parseInt(ZOTERO_LIMIT, 10);
  const pageSize = Number.isFinite(limit) ? limit : 100;
  const results = [];
  let start = 0;

  while (true) {
    const page = await fetchZoteroJson(libraryPath, resourcePath, {
      ...extraParams,
      start: String(start),
      limit: String(pageSize)
    });

    results.push(...page);

    if (page.length < pageSize) {
      return results;
    }

    start += pageSize;
  }
}

async function fetchCollectionKeys(libraryPath, collectionKey) {
  const keys = [collectionKey];

  if (!shouldIncludeSubcollections()) {
    return keys;
  }

  const subcollections = await fetchPagedZoteroJson(
    libraryPath,
    `collections/${collectionKey}/collections`,
    { include: 'data' }
  );

  for (const subcollection of subcollections) {
    keys.push(...await fetchCollectionKeys(libraryPath, subcollection.key));
  }

  return keys;
}

async function fetchZoteroItems() {
  requireEnv('ZOTERO_LIBRARY_ID', ZOTERO_LIBRARY_ID);

  const libraryPath = getLibraryPath(ZOTERO_LIBRARY_TYPE, ZOTERO_LIBRARY_ID);
  const itemParams = {
    sort: 'date',
    direction: 'desc'
  };

  if (!ZOTERO_COLLECTION_KEY) {
    return fetchPagedZoteroJson(libraryPath, 'items/top', itemParams);
  }

  const collectionKeys = await fetchCollectionKeys(libraryPath, ZOTERO_COLLECTION_KEY);
  const itemsByKey = new Map();

  for (const collectionKey of collectionKeys) {
    const items = await fetchPagedZoteroJson(
      libraryPath,
      `collections/${collectionKey}/items/top`,
      itemParams
    );

    for (const item of items) {
      itemsByKey.set(item.key, item);
    }
  }

  return Array.from(itemsByKey.values());
}

async function main() {
  const items = await fetchZoteroItems();
  const publications = items
    .map(mapZoteroItem)
    .filter(item => item.title && !SKIPPED_ITEM_TYPES.has(item.itemType));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      provider: 'zotero',
      libraryType: ZOTERO_LIBRARY_TYPE,
      libraryId: ZOTERO_LIBRARY_ID,
      collectionKey: ZOTERO_COLLECTION_KEY || null,
      includeSubcollections: shouldIncludeSubcollections()
    },
    items: publications
  };

  const outputPath = path.resolve(process.cwd(), ZOTERO_OUTPUT_PATH);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${publications.length} publications to ${outputPath}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
