# Phase 3 Controls Audit

| Control                              | Status | End-to-end behavior                                                    |
| ------------------------------------ | ------ | ---------------------------------------------------------------------- |
| GitHub link                          | green  | Opens https://github.com/baditaflorin/paste-scraper-builder            |
| PayPal link                          | green  | Opens https://www.paypal.com/paypalme/florinbadita                     |
| Upload button                        | green  | Opens file picker; HTML loads as source; JSON restores project state.  |
| Clipboard button                     | green  | Reads clipboard text or gives permission fallback.                     |
| Sample button                        | green  | Loads sample HTML and runs inference.                                  |
| Clear draft                          | green  | Clears current project, URL hash, and IndexedDB draft.                 |
| Source URL input                     | green  | Updates project source URL and re-runs inference/URL normalization.    |
| Auto-infer setting                   | green  | Toggles whether paste/upload replaces selectors with inferred guesses. |
| CSV provenance setting               | green  | Toggles provenance/confidence columns in CSV.                          |
| Picker row/field mode                | green  | Chooses row or field picking mode in the iframe.                       |
| CSS/XPath selector mode              | green  | Chooses selector syntax for manual picks.                              |
| Field name/value controls            | green  | Configure the next manual field pick.                                  |
| Row selector input                   | green  | Manually overrides inferred row selector.                              |
| Field name/attribute/selector inputs | green  | Edit existing field rules and refresh preview/export.                  |
| Remove field                         | green  | Removes a field from preview and exports.                              |
| Save local draft                     | green  | Persists project in IndexedDB.                                         |
| Share link                           | green  | Copies hash-encoded state, with too-large fallback.                    |
| Download active export               | green  | Downloads CSV/JSON/Python/Go depending on active tab.                  |
| Export tabs                          | green  | Switch active export content.                                          |
| Copy active export                   | green  | Copies active export content.                                          |
| Debug overlay via `?debug=1`         | green  | Shows inference, preview, and settings state for support.              |

Green: 21. Yellow: 0. Red: 0.
