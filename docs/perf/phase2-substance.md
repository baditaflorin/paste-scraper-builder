# Phase 2 Substance Performance Notes

Measured during the local fixture suite on 2026-05-09.

| Scope                                     | Result                                          |
| ----------------------------------------- | ----------------------------------------------- |
| Real fixture pass                         | 10/10 inferred or failed gracefully as expected |
| Synthetic robustness pass                 | 5/5 no crash                                    |
| Full Vitest suite after state-codec split | 36 tests in about 30 seconds                    |
| Initial JS gzip                           | 113 KB, below 200 KB budget                     |
| Largest fixture                           | Wikipedia HTML, about 786 KB                    |

The suite exercises real browser DOM parsing through jsdom, which is slower than the production browser path. Large pages are still analyzed synchronously; cancellation and workers remain Phase 4 candidates if users routinely paste multi-megabyte pages.
