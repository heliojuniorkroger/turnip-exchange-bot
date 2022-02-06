# Turnip Exchange Bot

![Daisy Mae](https://static.wikia.nocookie.net/animalcrossing/images/6/69/Daisy_Mae_NH.png)

Always grant you a good position on [https://turnip.exchange](https://turnip.exchange)'s queues.

## Installing dependencies

You can install the dependencies by running:

```
npm install
```

Or, if you're rather use yarn:

```
yarn
```

And you're absolutely good to go.

## How to use it

All you need to set up and run is to create a file named `config.json` on the root folder of the project. After that, you can copy paste these lines of code:

```json
{
  "name": "Helio",
  "minimumAmountBells": 500,
  "islandCode": null,
  "autoVerify": true
}
```

This is very straightforward. But here's what every property does:

- **name** - Your user's name on the Turnip Exchange's queue
- **minimumAmountBells** - The minimum necessary amount of bells per turnip
- **islandCode** - If you want to visit a specific island, you can just put its code here, and it'll automatically join its queue
- **autoVerify** - This will always wait for new islands rather than joining existing ones (if you have the patience, this is the greatest method, since it'll most likely guarantee the first place to you)

With this all set, you're good to go:

```
npm start
```
