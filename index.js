const crypto = require('crypto');
const httpRequest = require('request-promise-native');
const TelegramBot = require('node-telegram-bot-api');
const { telegramKey, telegramOwner, bitmexPublic, bitmexPrivate } = require('./keys');
const bot = new TelegramBot(telegramKey, { polling: true });
const bartTasks = [];
const zigzagTasks = [];
const lastError = null;

bot.on('message', (...args) => handleCommand(...args).catch(console.error));
bot.sendMessage(telegramOwner, 'Rebooted!').catch(console.error);

async function handleCommand(message) {
    const id = message.from.id;
    const [command, ...data] = message.text.split(/ +/);

    if (id !== telegramOwner) {
        await tg('Just private use only.', id);
        return;
    }

    await route(command, data);
}

async function route(command, data) {
    switch (command) {
        case '/status':
            await status();
            return;

        case '/bart':
        case '/zigzag':
            await order(command.slice(1), data);
            return;

        case '/cancel':
            await cancel(data);
            return;
    }

    await tg('Unknown command');
}

async function tg(text, id = telegramOwner) {
    await bot.sendMessage(id, text);
}

async function status() {
    const bart = JSON.stringify(bartTasks.filter(task => task.active), null, 2);
    const zigzag = JSON.stringify(zigzagTasks.filter(task => task.active), null, 2);

    await tg(`Bart:\n${bart}\n\nZigZag:\n${zigzag}\n\nLast error:\n${lastError}`);
}

async function order(type, [amount, enter, stop]) {
    [amount, enter, stop] = [amount, enter, stop].map(v => Number(v));

    if ([amount, enter, stop].some(v => !Number.isFinite(v))) {
        await tg('Invalid args');
        return;
    }

    const task = {
        active: false,
        amount,
        enter,
        stop,
        exitTrigger: null,
        exit: null,
        isLong: stop < enter,
        stopAmount: null,
        exitAmount: null,
    };

    if (type === 'bart') {
        task.exit = Math.round(task.enter * (1 - (task.stop / task.enter - 1) * 0.86));
        task.stop = Math.round(task.enter * (1 - (task.stop / task.enter - 1) * -0.86));
    } else {
        task.exit = Math.round(task.enter * (1 - (task.stop / task.enter - 1) * 2.8));
    }

    if (task.isLong) {
        task.exitAmount = Math.round(-task.amount * (task.exit / task.enter - 0.002));
        task.stopAmount = Math.round(-task.amount * (2 - (task.enter / task.stop + 0.002)));

        task.enter = Math.round(task.enter * 1.0005);
        task.exitTrigger = Math.round(task.exit * 0.9985);
    } else {
        task.amount = Math.round(-task.amount);
        task.exitAmount = Math.round(-task.amount * (task.exit / task.enter + 0.002));
        task.stopAmount = Math.round(-task.amount * (2 - (task.enter / task.stop - 0.002)));

        task.enter = Math.round(task.enter * 0.9995);
        task.exitTrigger = Math.round(task.exit * 1.0015);
    }

    await handleTask(task);

    task.active = true;

    if (type === 'bart') {
        bartTasks.push(task);
    } else {
        zigzagTasks.push(task);
    }

    await status();
}

async function handleTask(task) {
    // TODO -
}

async function cancel([type, id]) {
    let task;

    if (!type || !id || ['bart', 'zigzag'].includes(type) || !Number.isFinite(id)) {
        await tg('Invalid args');
        return;
    }

    if (type === 'bart') {
        task = bartTasks[id];
    } else {
        task = zigzagTasks[id];
    }

    if (!task) {
        await tg('Unknown task');
        return;
    }

    await cancelTask(task);

    task.active = false;

    await status();
}

async function cancelTask(task) {
    // TODO -
}
