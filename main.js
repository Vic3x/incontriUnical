// import the necessary libraries
import * as dotenv from 'dotenv';
import mysql from 'mysql2';
import { Telegraf } from 'telegraf';

// load the environment variables from the .env file
dotenv.config()

// initialize the bot with the Bot Token
const bot = new Telegraf(process.env.BOT_TOKEN)

// middleware to create a connection to the database
bot.use(async (ctx, next) => {
    // create a connection to the database
    ctx.state.connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    })
    // move to the next middleware or handler
    await next()
})

// command handler for '/start' command
bot.command('start', async (ctx) => {
    // get the chat id of the user
    const chatId = ctx.update.message.from.id
    // message to send to the user
    const message = `Scegli il tuo sesso:`
    // inline keyboard with options for the user
    const inlineKeyboard = [
        [
            { text: 'Maschio', callback_data: 'male' },
            { text: 'Femmina', callback_data: 'female' }
        ]
    ]

    // send the message to the user with the inline keyboard
    await ctx.reply(message, { reply_markup: { inline_keyboard: inlineKeyboard } })
})

// action handler for 'male' callback query
bot.action('male', async (ctx) => {
    // get the chat id of the user
    const chatId = ctx.update.callback_query.from.id
    // answer the callback query
    await ctx.answerCbQuery()
    // set the gender of the user as male
    ctx.state.gender = 'male'
    // query the database for an available female user
    ctx.state.connection.query(`SELECT * FROM users WHERE gender = 'female' AND chatId IS NULL LIMIT 1`, async (error, results) => {
        if (error) {
            // log the error
            console.error(error)
        } else if (results.length > 0) {
            // get the first available female user
            const partner = results[0]
            // update the chatId of the female user with the chat id of the male user
            await ctx.state.connection.query(`UPDATE users SET chatId = ${chatId} WHERE id = ${partner.id}`)
            // set the partner of the male user
            ctx.state.partner = partner
            // send a message to start the chat
            await ctx.reply(`Iniziando chat con un utente di sesso opposto...`)
            // prompt the user to send a message
            await ctx.reply(`Scrivi il tuo messaggio.`)
        } else {
            // send a message if there are no available female users
            await ctx.reply(`Al momento non ci sono utenti di sesso opposto disponibili.`)
        }
    })
})

bot.action('female', async (ctx) => {
    const chatId = ctx.update.callback_query.from.id
    await ctx.answerCbQuery()
    ctx.state.gender = 'female'
    ctx.state.connection.query(`SELECT * FROM users WHERE gender = 'male' AND chatId IS NULL LIMIT 1`, async (error, results) => {
        if (error) {
            console.error(error)
        }
        else if (results.length > 0) {
            const partner = results[0]
            await ctx.state.connection.query(`UPDATE users SET chatId = ${chatId} WHERE id = ${partner.id}`)
            ctx.state.partner = partner
            await ctx.reply(`Iniziando chat con un utente di sesso opposto...`)
            await ctx.reply(`Scrivi il tuo messaggio.`)
        }
        else {
            await ctx.reply(`Al momento non ci sono utenti di sesso opposto disponibili.`)
        }
    })
})

// Listener for when a user sends a text message
bot.on('text', async (ctx) => {
    // If the user does not have a partner, return and do nothing
    if (!ctx.state.partner) {
        return
    }

    // Get the text message from the update
    const message = ctx.update.message.text
    // Get the chatId of the user who sent the message
    const chatId = ctx.update.message.from.id
    // Get the chatId of the user's partner
    const partnerChatId = ctx.state.partner.chatId

    // If the chatId of the user and the chatId of their partner are the same, return and do nothing
    if (chatId === partnerChatId) {
        return
    }

    // Get the first name of the user who sent the message
    const name = ctx.update.message.from.first_name
    // Get the first name of the user's partner
    const partnerName = ctx.state.partner.firstName

    // Send the message from the user to their partner
    await ctx.telegram.sendMessage(partnerChatId, `${name}: ${message}`)
    // Send the message from the partner to the user
    await ctx.reply(`${partner} : ${message}`)
})

bot.launch()




