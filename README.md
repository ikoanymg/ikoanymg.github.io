# ikoanymg.github.io
my portfolio

## Publications

Publications are rendered from `data/publications.json`. The file can be updated from Zotero with:

```sh
node scripts/update-publications.mjs
```

The script defaults to this Zotero source:

- Library type: `user`
- Library ID: `12053584`
- Collection: `01_Projects/My publication`
- Collection key: `JY3HN4I2`
- Include subcollections: `false`

If the library is private, set `ZOTERO_API_KEY`. By default, the generated JSON is written to `data/publications.json`. To write to another file, set `ZOTERO_OUTPUT_PATH`.

To limit the site to one Zotero collection or subcollection, set `ZOTERO_COLLECTION_KEY`:

```sh
ZOTERO_COLLECTION_KEY=your-collection-key node scripts/update-publications.mjs
```

By default, only items directly inside that collection are fetched. To include nested subcollections, set:

```sh
ZOTERO_INCLUDE_SUBCOLLECTIONS=true
```

For GitHub Actions, the library and collection values are already set in `.github/workflows/update-publications.yml`. Configure only this repository secret when the Zotero library is private:

- Repository secret `ZOTERO_API_KEY`

Zotero API keys must be stored as GitHub Actions secrets, not variables or committed files.

The workflow in `.github/workflows/update-publications.yml` can be run manually and is also scheduled weekly.

For local preview, serve the directory instead of opening `index.html` directly, because the browser fetches `data/publications.json`:

```sh
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

`data/zotero-collections.json` is a local reference file for collection keys. It should contain collection names, paths, and keys only. Do not store Zotero API keys in that file.

To refresh the collection-key reference file from Zotero:

```sh
ZOTERO_API_KEY=your-api-key node scripts/update-zotero-collections.mjs
```

For public libraries, `ZOTERO_API_KEY` can be omitted.
