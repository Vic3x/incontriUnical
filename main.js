import dotenv from 'dotenv';
import extra, { Telegraf } from 'telegraf';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const maleUsers = [];
const femaleUsers = [];

bot.command('start', (ctx) => {
    ctx.reply(`Sei maschio o femmina?`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Maschio', callback_data: 'male' },
                    { text: 'Femmina', callback_data: 'female' },
                ],
            ],
        },
    });
});

bot.action('male', (ctx) => {
    maleUsers.push(ctx.from.id);
    ctx.deleteMessage();
    ctx.reply(`Grazie per aver selezionato il tuo sesso. Attenderemo un partner di sesso opposto.`);

    if (femaleUsers.length > 0) {
        let partnerId = femaleUsers.shift();
        bot.telegram.sendMessage(partnerId, `Hai un nuovo partner maschio!`);
        bot.telegram.sendMessage(ctx.from.id, `Hai un nuovo partner femmina!`);
    }
});

bot.action('female', (ctx) => {
    femaleUsers.push(ctx.from.id);
    ctx.deleteMessage();
    ctx.reply(`Grazie per aver selezionato il tuo sesso. Attenderemo un partner di sesso opposto.`);

    if (maleUsers.length > 0) {
        let partnerId = maleUsers.shift();
        bot.telegram.sendMessage(partnerId, `Hai un nuovo partner femmina!`);
        bot.telegram.sendMessage(ctx.from.id, `Hai un nuovo partner maschio!`);
    }
});

bot.command('end', (ctx) => {
    ctx.deleteMessage();
    ctx.reply(`Grazie per aver usato il nostro bot. Speriamo di vederti di nuovo presto!`);
    let index;
    if (maleUsers.indexOf(ctx.from.id) !== -1) {
        index = maleUsers.indexOf(ctx.from.id);
        maleUsers.splice(index, 1);
    } else if (femaleUsers.indexOf(ctx.from.id) !== -1) {
        index = femaleUsers.indexOf(ctx.from.id);
        femaleUsers.splice(index, 1);
    }
});

bot.on('message', (ctx) => {
    if (maleUsers.indexOf(ctx.from.id) !== -1 || femaleUsers.indexOf(ctx.from.id) !== -1) {
        let partnerId;
        if (maleUsers.indexOf(ctx.from.id) !== -1) {
            partnerId = femaleUsers[maleUsers.indexOf(ctx.from.id)];
        } else {
            partnerId = maleUsers[femaleUsers.indexOf(ctx.from.id)];
        }
        bot.telegram.sendMessage(partnerId, 'Il tuo partner : $(ctx.message.text)');
    } else {
        ctx.reply('Per iniziare a chattare, per favore utilizza il comando /start.');
    }
});

bot.launch();
