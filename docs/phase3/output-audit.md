# Phase 3 Output Pathway Audit

| Exit path             | Status | Evidence                                                                                                                             | Decision              |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| CSV preview export    | green  | CSV tab uses extracted preview rows and selected fields.                                                                             | Keep.                 |
| CSV provenance export | green  | Setting-controlled metadata columns include app version, schema version, source URL, row selector, shape, and field confidence/type. | Keep.                 |
| Plain CSV export      | green  | Provenance setting can be disabled and output falls back to field-only CSV.                                                          | Keep.                 |
| JSON project export   | green  | JSON tab emits the validated project state and can be uploaded back.                                                                 | Keep.                 |
| Python scraper export | green  | Python tab includes selectors, metadata, field confidence/type, and normalizers.                                                     | Keep.                 |
| Go scraper export     | green  | Go tab includes selectors, metadata, and common normalizers.                                                                         | Keep.                 |
| Copy output           | green  | Copy button copies the active tab output with a toast.                                                                               | Keep.                 |
| Download output       | green  | Download button downloads the active CSV/JSON/Python/Go artifact with an appropriate filename and MIME type.                         | Keep.                 |
| Share link            | green  | Share button encodes small project states in the URL hash and copies the URL.                                                        | Keep with size guard. |
| Print/PDF             | gray   | Not claimed and not central to scraper-building.                                                                                     | Out of scope.         |
| API/curl output       | gray   | No runtime API exists in Mode A.                                                                                                     | Out of scope.         |
| Screenshot/embed      | gray   | Not claimed.                                                                                                                         | Out of scope.         |

Green: 9. Yellow: 0. Red: 0. Gray: 3.
