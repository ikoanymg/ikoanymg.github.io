import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const {
  ZOTERO_LIBRARY_TYPE = 'user',
  ZOTERO_LIBRARY_ID = '12053584',
  ZOTERO_API_KEY,
  ZOTERO_COLLECTIONS_OUTPUT_PATH = 'data/zotero-collections.json'
} = process.env;

const SUPPORTED_LIBRARY_TYPES = new Set(['user', 'group']);

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

async function fetchCollections(libraryPath) {
  const params = new URLSearchParams({
    format: 'json',
    include: 'data',
    limit: '100'
  });
  const headers = {
    'Zotero-API-Version': '3'
  };

  if (ZOTERO_API_KEY) {
    headers['Zotero-API-Key'] = ZOTERO_API_KEY;
  }

  const results = [];
  let start = 0;

  while (true) {
    params.set('start', String(start));

    const response = await fetch(`https://api.zotero.org/${libraryPath}/collections?${params}`, {
      headers
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Zotero API request failed: ${response.status} ${body}`);
    }

    const page = await response.json();
    results.push(...page);

    if (page.length < 100) {
      return results;
    }

    start += 100;
  }
}

function buildCollectionPath(collection, collectionsByKey) {
  const names = [collection.data.name];
  let parentKey = collection.data.parentCollection;

  while (parentKey) {
    const parent = collectionsByKey.get(parentKey);

    if (!parent) {
      break;
    }

    names.unshift(parent.data.name);
    parentKey = parent.data.parentCollection;
  }

  return names.join('/');
}

function mapCollections(collections) {
  const collectionsByKey = new Map(collections.map(collection => [collection.key, collection]));

  return collections
    .map(collection => ({
      path: buildCollectionPath(collection, collectionsByKey),
      name: collection.data.name,
      key: collection.key,
      parentCollection: collection.data.parentCollection || null,
      numItems: collection.meta?.numItems || 0,
      numCollections: collection.meta?.numCollections || 0,
      includeSubcollections: false,
      purpose: ''
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

async function main() {
  requireEnv('ZOTERO_LIBRARY_ID', ZOTERO_LIBRARY_ID);

  const libraryPath = getLibraryPath(ZOTERO_LIBRARY_TYPE, ZOTERO_LIBRARY_ID);
  const collections = await fetchCollections(libraryPath);
  const payload = {
    generatedAt: new Date().toISOString(),
    library: {
      type: ZOTERO_LIBRARY_TYPE,
      id: ZOTERO_LIBRARY_ID
    },
    collections: mapCollections(collections)
  };

  const outputPath = path.resolve(process.cwd(), ZOTERO_COLLECTIONS_OUTPUT_PATH);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${payload.collections.length} collections to ${outputPath}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
