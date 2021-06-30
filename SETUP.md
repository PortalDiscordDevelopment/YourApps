# How to set up

1. Install yarn if you have not already (`npm i -g yarn`)
2. `cd` into bot directory if you have not already
3. Run `yarn` to install all dependencies
4. Copy `src/config/example-options.ts` to `src/config/options.ts` and change all the values
   - This requires a postgres server to be set up with a database named `yourapps`, and then enter connection details into the config. Postgres server can be downloaded for pretty much any OS.
5. Use `yarn start` to start the bot running.
