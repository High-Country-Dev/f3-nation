# Changelog

## [0.5.0](https://github.com/High-Country-Dev/f3-nation/compare/pkg-api@0.4.1...pkg-api@0.5.0) (2026-07-28)


### Features

* **api,admin:** fail approve loudly when reviewer can't edit an affected org ([e9524e9](https://github.com/High-Country-Dev/f3-nation/commit/e9524e98741779947686d8e26c505dde78d8ee43))
* **api:** adding slack messaging API routes ([#542](https://github.com/High-Country-Dev/f3-nation/issues/542)) ([951e126](https://github.com/High-Country-Dev/f3-nation/commit/951e12600a4a49d6c0cc87e30c9648a227f777f1))
* **api:** stamp reviewedBy/reviewedAt on rejectSubmission ([d8978ce](https://github.com/High-Country-Dev/f3-nation/commit/d8978cee6b7a3bf5f86ec0076d413584c8219264))
* **map:** surface selector load errors and remove dead newEventId ([fb6084c](https://github.com/High-Country-Dev/f3-nation/commit/fb6084c746ae6173be258d192ca980d78c7f7a57))
* **slackbot, api:** preblast feature refactor + some extras ([#599](https://github.com/High-Country-Dev/f3-nation/issues/599)) ([f5766df](https://github.com/High-Country-Dev/f3-nation/commit/f5766dfc3972759a3641221d8cadaca916a911b4))
* **validators:** enhance event time handling in AdminRequestsModal ([8d407de](https://github.com/High-Country-Dev/f3-nation/commit/8d407defc1e92a5b32b82c2aa1fe78bc8aa5a7b5))


### Bug Fixes

* **admin,map,api:** polish from independent review of [#274](https://github.com/High-Country-Dev/f3-nation/issues/274) fixes ([2b0e5f0](https://github.com/High-Country-Dev/f3-nation/commit/2b0e5f08bab4e2283bfd2433e70bdd743d34de7c))
* **admin,map:** keep server logger out of the client bundle ([#274](https://github.com/High-Country-Dev/f3-nation/issues/274) CI) ([4ea5c12](https://github.com/High-Country-Dev/f3-nation/commit/4ea5c1299fde6e0ff06b582bed1d607179b6fd35))
* **admin:** enhance error handling and logging for request details ([2629175](https://github.com/High-Country-Dev/f3-nation/commit/262917536a32715fff8e709e41a3a96d6e4e1a1e))
* **api,me:** require filters and cap results on me.users ([#662](https://github.com/High-Country-Dev/f3-nation/issues/662)) ([70375fc](https://github.com/High-Country-Dev/f3-nation/commit/70375fc0b396b9f8f0aefd74b407a4ba9aae3b7f))
* **api:** honor reviewer-edited region + guard double-review ([#274](https://github.com/High-Country-Dev/f3-nation/issues/274) review) ([c255fee](https://github.com/High-Country-Dev/f3-nation/commit/c255feee58d743d3826d17500724dfc57597a2a1))
* **deps:** pin internal @acme/* refs to workspace:* to prevent release-please version drift ([#587](https://github.com/High-Country-Dev/f3-nation/issues/587)) ([21ded4b](https://github.com/High-Country-Dev/f3-nation/commit/21ded4bef25dbdd00b2e66e5d8abda516b7dd0b1))
* **map,admin:** regions in region picker were grayed out ([37cec72](https://github.com/High-Country-Dev/f3-nation/commit/37cec722b933f6a121283403b3a5eb9fd8900f5e))
* **map:** streamline form inputs and fix map update pane ([f1a09fe](https://github.com/High-Country-Dev/f3-nation/commit/f1a09fe1b3126e697e6a3299f3aa4952f12d1267))
* **map:** update uuid dependency and refine map contribution guidelines ([aba0ae9](https://github.com/High-Country-Dev/f3-nation/commit/aba0ae9e83d92db666de871b7311917efb2910c0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @acme/auth bumped to 0.1.6
    * @acme/db bumped to 0.3.0
    * @acme/env bumped to 0.1.3
    * @acme/logger bumped to 0.2.0
    * @acme/mail bumped to 0.1.3
    * @acme/shared bumped to 0.2.0
    * @acme/validators bumped to 0.3.0

## [0.4.1](https://github.com/F3-Nation/f3-nation/compare/pkg-api@0.4.0...pkg-api@0.4.1) (2026-07-26)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @acme/auth bumped to 0.1.5
    * @acme/db bumped to 0.2.0
    * @acme/validators bumped to 0.2.0

## [0.4.0](https://github.com/F3-Nation/f3-nation/compare/pkg-api@0.3.1...pkg-api@0.4.0) (2026-07-23)


### Features

* **slackbot, api:** preblast feature refactor + some extras ([#599](https://github.com/F3-Nation/f3-nation/issues/599)) ([f5766df](https://github.com/F3-Nation/f3-nation/commit/f5766dfc3972759a3641221d8cadaca916a911b4))

## [0.3.1](https://github.com/F3-Nation/f3-nation/compare/pkg-api@0.3.0...pkg-api@0.3.1) (2026-07-14)


### Bug Fixes

* **api,me:** require filters and cap results on me.users ([#662](https://github.com/F3-Nation/f3-nation/issues/662)) ([70375fc](https://github.com/F3-Nation/f3-nation/commit/70375fc0b396b9f8f0aefd74b407a4ba9aae3b7f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @acme/auth bumped to 0.1.4
    * @acme/db bumped to 0.1.3
    * @acme/shared bumped to 0.1.3
    * @acme/validators bumped to 0.1.3

## [0.3.0](https://github.com/F3-Nation/f3-nation/compare/pkg-api@0.2.1...pkg-api@0.3.0) (2026-07-08)


### Features

* **api:** adding slack messaging API routes ([#542](https://github.com/F3-Nation/f3-nation/issues/542)) ([951e126](https://github.com/F3-Nation/f3-nation/commit/951e12600a4a49d6c0cc87e30c9648a227f777f1))


### Bug Fixes

* **deps:** pin internal @acme/* refs to workspace:* to prevent release-please version drift ([#587](https://github.com/F3-Nation/f3-nation/issues/587)) ([21ded4b](https://github.com/F3-Nation/f3-nation/commit/21ded4bef25dbdd00b2e66e5d8abda516b7dd0b1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @acme/auth bumped to 0.1.3
    * @acme/db bumped to 0.1.2
    * @acme/env bumped to 0.1.2
    * @acme/mail bumped to 0.1.2
    * @acme/shared bumped to 0.1.2
    * @acme/storage bumped to 0.2.2
    * @acme/validators bumped to 0.1.2

## [0.2.1](https://github.com/F3-Nation/f3-nation/compare/pkg-api@0.2.0...pkg-api@0.2.1) (2026-07-05)


### Bug Fixes

* **map,admin:** regions in region picker were grayed out ([37cec72](https://github.com/F3-Nation/f3-nation/commit/37cec722b933f6a121283403b3a5eb9fd8900f5e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @acme/auth bumped to 0.1.2
    * @acme/db bumped to 0.1.1
    * @acme/env bumped to 0.1.1
    * @acme/logger bumped to 0.1.1
    * @acme/mail bumped to 0.1.1
    * @acme/shared bumped to 0.1.1
    * @acme/storage bumped to 0.2.1
    * @acme/validators bumped to 0.1.1
