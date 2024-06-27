const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs');
const path = require('path');

// create a new client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

// collection for commands
client.commands = new Collection();

// Reading command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

// Reading event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token).then(async () => {
    // fetch the welcome role reaction message on startup
    const welcomeRoleReactionMessageId = '1245836542895849512';
    const rolesChannelId = '1245829297135157340';
    const rolesChannel = await client.channels.fetch(rolesChannelId);
    const welcomeRoleId = '1245857560746004500';

    if (rolesChannel) {
        const message = await rolesChannel.messages.fetch(welcomeRoleReactionMessageId);
        if (message) {
            // process existing reactions
            message.reactions.cache.forEach(reaction => {
                reaction.users.fetch().then(users => {
                    users.forEach(user => {
                        if (!user.bot) {
                            const member = message.guild.members.cache.get(user.id);
                            if (member && !member.roles.cache.has(welcomeRoleId)) {
                                client.emit('messageReactionAdd', reaction, user);
                            }
                        }
                    });
                });
            });
        }
    }
});