<h1 align = "center">
	YourApps
</h1>

<div align="center">

[![made with typescript badge](https://img.shields.io/badge/Made%20With-TypeScript-007acc?style=for-the-badge&logo=typescript&logocolor=white)](https://www.typescriptlang.org/)

</div>

Yourapps is a discord bot to handle applications inside of discord.

## How to set up

1. Install yarn if you have not already (`npm i -g yarn`)
2. `cd` into bot directory if you have not already
3. Run `yarn` to install all dependencies
4. Copy `src/config/example-options.ts` to `src/config/options.ts` and change all the values
   - This requires a postgres server to be set up with a database named `yourapps`, and then enter connection details into the config. Postgres server can be downloaded for pretty much any OS.
5. Use `yarn start` to start the bot running.

## Contributing

If you would like to contribute, please make your changes, and then run `yarn format` to correct any formatting issues.

### Commit messages

All commit messages should use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Types:

- fix: Something was fixed
- feat: Something new was added
- refactor: Internal code was changed, dependencies were updated, configuration was changed, etc
- docs: Documentation was changed and/or updated
  Optional scopes:
- Dev: Developer-specific things (e.g. fixing eval command)
- Apps: Applications-specific things (e.g. adding a new feature to applications)
- CI: CI-specifc things (e.g. fixing github actions)
- i18n: Language-specific things (e.g. fixing translations)
