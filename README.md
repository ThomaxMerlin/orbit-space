# ORBIT — An Atlas of the Cosmos

An interactive space education website built with HTML, CSS, JavaScript and Three.js.

## Explore

- Interactive planets, the Sun, Moon, black holes and Milky Way
- Stars and stellar life cycles
- Spacecraft, spacesuits and astronaut profiles
- NASA and SpaceX mission guides
- A filterable space-history timeline
- A fact-based chat guide with random questions and quizzes

The models are simplified educational illustrations, not physical simulations. Scientific references are linked within the pages. The chat guide uses a local fact library; it does not call an AI service.

## Run locally

From the repository root, run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Serve the files over HTTP rather than opening index.html directly, because the site uses JavaScript modules.

No dependency installation or compilation is required. Edit the files in `dist/` directly. Three.js is included under `dist/vendor/`. Fonts use Google Fonts with local font fallbacks.

## Deploy

The complete deployable website is in `dist/`. Use `dist` as the output directory on a static host. There is no build step. For drag-and-drop hosting, upload the contents of `dist`, so `index.html` is at the upload root.

For a Cloudflare Pages project connected to GitHub, use the static/no-framework option, set the build output directory to `dist`, and leave the build command empty when supported. The published address is assigned by the host.

## Repository contents

- `dist/index.html`: main atlas
- `dist/*.html`: subject pages
- `dist/app.js`: main Three.js explorer
- `dist/flight-models.js`: illustrative spacecraft and suit models
- `dist/guide*.js`: local question and quiz logic
- `dist/navigation.*`: shared responsive navigation

The `.openai/` directory is specific to the original hosting environment and is not needed for independent hosting. Exclude it when exporting to a new GitHub repository.

## Credits

Three.js r170 is distributed under the MIT license; its copyright header is retained in the bundled module. The Earth texture was obtained from the Three.js examples collection. NASA and SpaceX information is linked to its original sources within the website. This project is an independent educational guide, not an official NASA or SpaceX website.
