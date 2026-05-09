# Phase 3 Input Pathway Audit

Status legend: green = works fully; yellow = works partially or with documented limits; red = claimed but broken; gray = not built and not claimed.

| Entry point                       | Status | Evidence                                                                                                                        | Decision                                                      |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Paste rendered HTML into textarea | green  | `ScraperBuilder` updates project HTML, runs inference, previews rows, and autosaves. Covered by fixture tests and smoke sample. | Keep.                                                         |
| HTML file upload                  | green  | Hidden file input accepts `.html`/`.htm`; loaded text follows the same inference path as paste.                                 | Keep.                                                         |
| Drag-drop HTML file               | green  | Source panel handles `drop` and passes files through the upload path.                                                           | Keep.                                                         |
| Clipboard read                    | green  | Clipboard button calls `navigator.clipboard.readText`; denial produces actionable fallback copy.                                | Keep.                                                         |
| Source URL input                  | green  | URL is captured as source metadata and used to resolve relative `href`/`src` values.                                            | Keep; no direct fetch because CORS is the product constraint. |
| URL fetch                         | gray   | Not claimed. Runtime fetch would hit CORS and create false confidence.                                                          | Keep out of scope; user pastes rendered HTML.                 |
| Project JSON import               | green  | Uploading exported JSON validates against `scraperProjectSchema` and restores selectors/fields.                                 | Keep.                                                         |
| Share-link import                 | green  | `#state=` links decode and validate project state on first load.                                                                | Keep with URL-size limit.                                     |
| Local autosave restore            | green  | IndexedDB draft is restored unless a share link is present.                                                                     | Keep.                                                         |
| Sample/demo input                 | green  | Sample button loads bundled HTML and runs the same inference/export path.                                                       | Keep as one input path, not the only path.                    |
| Multi-file batch                  | gray   | Not claimed in README or UI.                                                                                                    | Out of scope for this single-page selector builder.           |
| Image/PDF upload                  | gray   | Not claimed and not compatible with paste-rendered-HTML scope.                                                                  | Out of scope.                                                 |
| Folder upload/mobile camera       | gray   | Not claimed.                                                                                                                    | Out of scope.                                                 |

Green: 9. Yellow: 0. Red: 0. Gray: 4.
