import colors from 'colors';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import notifier from 'node-notifier';
import {
  getIsland,
  getIslands,
  getQueueStatus,
  grabCode,
  joinIslandQueue,
} from './api';
import { IslandCategory, IslandIslander } from './constants';
import type { Island, Config } from './types';

const getConfig = () => {
  const content = fs.readFileSync(path.resolve(__dirname, '../config.json'), {
    encoding: 'utf-8',
  });

  return JSON.parse(content) as Config;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logError = (message: string) => console.log(colors.red(`❌ ${message}`));

const getVisitorID = (
  islandId: string
): Promise<{ ws: WebSocket; visitorID: string }> =>
  new Promise((resolve) => {
    const ws = new WebSocket(
      'wss://w92pvtybp7.execute-api.us-west-2.amazonaws.com/production',
      {
        origin: 'https://turnip.exchange',
      }
    );

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          action: 'join',
          turnipCode: islandId,
          visitorID: null,
        })
      );

      ws.on('message', (message) => {
        const { action, data } = JSON.parse(message.toString());
        if (action === 'joined') {
          resolve({ ws, visitorID: data.visitorID });
        }
      });
    });
  });

const handleIsland = async (
  island: Island,
  visitorID: string
): Promise<'ok'> => {
  console.log(colors.green(`Checking ${island.name}'s status...`));

  const { data } = await getQueueStatus(island.turnipCode, visitorID);

  if (data.success) {
    if (data.yourPlace === 1) {
      console.log(
        `🤩 Your Dodo Code for ${colors.bold(
          island.name
        )} is ready! Grabbing it...`
      );

      const { data: codeData } = await grabCode(island.turnipCode, visitorID);

      console.log(`There you go: ${colors.bold(codeData.dodoCode)}`);

      notifier.notify({
        title: '🤩 Your Dodo Code is ready!',
        message: 'Open the terminal to check it out.',
      });

      return 'ok';
    }

    console.log(
      `${island.name}'s queue position: ${colors.yellow(
        `${String(data.yourPlace)}/${String(data.total)}`
      )}`
    );
  } else {
    logError(`Failed to get ${island.name}'s status.`);
    console.log(colors.red(`Response:`), data);
  }

  console.log(colors.cyan('⏱ Awaiting 15s...'));
  await sleep(15000);

  return handleIsland(island, visitorID);
};

const joinIsland = async (
  island: Island,
  visitorID: string,
  name: string
): Promise<'ok' | 'error'> => {
  const { data } = await joinIslandQueue(island.turnipCode, visitorID, name);

  if (data.success) {
    console.log(
      `✅ Joined ${island.name}'s queue - ${colors.green(
        String(island.turnipPrice)
      )} bells per turnip | ${colors.yellow(island.queued)}`
    );

    return 'ok';
  }

  logError(`Failed to join ${island.name}.`);
  console.log(colors.red(`Response:`), data);

  return 'error';
};

const connectToQueue = async (island: Island, name: string) => {
  console.log(colors.cyan('Generating visitor ID...'));

  const { visitorID, ws } = await getVisitorID(island.turnipCode);

  console.log(`✅ Your visitor ID: ${colors.green(visitorID)}`);

  await joinIsland(island, visitorID, name);
  await handleIsland(island, visitorID);

  ws.close();
};

const sortIslandsByQueue = (islands: Island[]) => {
  return [...islands].sort((a, b) => {
    const [aQueue] = a.queued.split('/');
    const [bQueue] = b.queued.split('/');

    return Number(aQueue) - Number(bQueue);
  });
};

const getAvailableIslands = (
  { minimumAmountBells }: Config,
  islands: Island[]
) =>
  islands.filter(
    (island) => island.turnipPrice >= minimumAmountBells && !island.discordOnly
  );

const spawnVerifier = async (config: Config) => {
  const verify = async (lastVerification = new Date()): Promise<Island[]> => {
    const { data } = await getIslands({
      islander: IslandIslander.NEITHER,
      category: IslandCategory.TURNIPS,
    });

    const latestIslands = getAvailableIslands(config, data.islands).filter(
      (island) => new Date(island.creationTime) > lastVerification
    );

    if (latestIslands.length) {
      return sortIslandsByQueue(latestIslands);
    }

    console.log(
      colors.yellow('😔 No new islands found. Searching for it again...')
    );

    await sleep(15000);

    return await verify(new Date());
  };

  return await verify();
};

const main = async () => {
  const config = getConfig();
  const { name, islandCode, autoVerify } = config;

  if (islandCode) {
    console.log(`🔎 Searching for ${colors.bold(islandCode)}...`);
    const { data } = await getIsland(islandCode);

    if (!data.success) {
      logError(`${islandCode} has either spoiled or was not found.`);
      return;
    }

    const island = {
      ...data.islandInfo,
      turnipCode: islandCode,
      queued: `${data.islandInfo.visitorCount}/${data.islandInfo.visitorLimit}`,
    };

    return await connectToQueue(island, name);
  }

  console.log('🔎 Searching for islands you can visit...');

  if (autoVerify) {
    const [firstCandidate] = await spawnVerifier(config);
    return connectToQueue(firstCandidate, name);
  }

  const { data } = await getIslands({
    islander: IslandIslander.NEITHER,
    category: IslandCategory.TURNIPS,
  });

  const islands = sortIslandsByQueue(getAvailableIslands(config, data.islands));

  if (!islands.length) {
    logError('No islands were found.');
    return;
  }

  const [firstCandidate] = islands;

  return connectToQueue(firstCandidate, name);
};

main();
