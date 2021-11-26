import colors from 'colors';
import WebSocket from 'ws';
import notifier from 'node-notifier';
import inquirer from 'inquirer';
import {
    getIsland,
    getIslands,
    getQueueStatus,
    grabCode,
    joinIslandQueue,
} from './api';
import { IslandCategory, IslandIslander } from './constants';
import { Island } from './types';

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

            const { data: codeData } = await grabCode(
                island.turnipCode,
                visitorID
            );

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

const main = async () => {
    const { name, specificIsland } = await inquirer.prompt([
        { type: 'input', name: 'name', message: "What's your name?" },
        {
            type: 'confirm',
            name: 'specificIsland',
            message: 'Do you want to join the queue of a specific island?',
        },
    ]);

    if (specificIsland) {
        const { islandId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'islandId',
                message: "What's the island id?",
            },
        ]);

        console.log(`🔎 Searching for ${colors.bold(islandId)}...`);
        const { data } = await getIsland(islandId);

        if (!data.success) {
            logError(`${islandId} has either spoiled or was not found.`);
            return;
        }

        const island = {
            ...data.islandInfo,
            turnipCode: islandId,
            queued: `${data.islandInfo.visitorCount}/${data.islandInfo.visitorLimit}`,
        };

        return await connectToQueue(island, name);
    }

    const { minBells } = await inquirer.prompt([
        {
            type: 'number',
            name: 'minBells',
            message: "What's the minimum bells value?",
            default: 500,
        },
    ]);

    console.log('🔎 Searching for islands you can visit...');

    const { data } = await getIslands({
        islander: IslandIslander.NEITHER,
        category: IslandCategory.TURNIPS,
    });

    const islands = data.islands.filter(
        (island) => island.turnipPrice >= minBells && !island.discordOnly
    );

    if (!islands.length) {
        logError('No islands were found.');
        return;
    }

    const { islandName } = await inquirer.prompt([
        {
            name: 'islandName',
            message: 'Which island do you wanna choose?',
            type: 'list',
            choices: islands.map(
                (island, index) =>
                    `${index} - ${island.name} - ${colors.green(
                        String(island.turnipPrice)
                    )} bells | ${colors.yellow(island.queued)}`
            ),
        },
    ]);

    const [islandIndex] = islandName.split('-');
    const island = islands[Number(islandIndex)];

    return connectToQueue(island, name);
};

main();
