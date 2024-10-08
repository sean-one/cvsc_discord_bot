const { Client, GatewayIntentBits, Collection } = require('discord.js');
const {
    token,
    SMOKERS_CLUB_MEMBER_ROLE,
    ROLES_CH_ID,
    SUPPORT_INSTRUCTIONS_CH_ID,
    ROLE_ACCESS_MESSAGE,
    SUPPORT_TICKET_MESSAGE,
    SUPPORT_TICKET_CATEGORY_ID
} = require('./config.json');
const fs = require('fs');
const path = require('path');

// Create a new Discord client with necessary intents to interact with guilds, messages, and reactions.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

// Initialize an empty collection to hold the bots commands
client.commands = new Collection();

// Reading command files from 'commands; directory and add them to the commands collection.
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    // Store command data in the commands collection with the command name as the key.
    client.commands.set(command.data.name, command);
}

// Read event files from the 'events' directory and register event listeners accordingly.
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    // If the event should only trigger once, use 'client.once'. Otherwise, use 'client.on'
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Log in to the Discord client using the provided token from the configuration file.
// index.js

client.login(token).then(async () => {
    // Define IDs from configuration for easier access.
    const welcomeRoleReactionMessageId = ROLE_ACCESS_MESSAGE;
    const rolesChannelId = ROLES_CH_ID;
    const welcomeRoleId = SMOKERS_CLUB_MEMBER_ROLE;
    const supportTicketMessageId = SUPPORT_TICKET_MESSAGE;
    const supportTicketChannelId = SUPPORT_INSTRUCTIONS_CH_ID;

    // Fetch the roles channel by ID.
    const rolesChannel = await client.channels.fetch(rolesChannelId);

    // Check if the roles channel was fetched successfully
    if (rolesChannel) {
        // Fetch the welcome message from the channel.
        const message = await rolesChannel.messages.fetch(welcomeRoleReactionMessageId);
        if (message) {
            // Process existing reactions on the welcome message.
            message.reactions.cache.forEach(reaction => {
                reaction.users.fetch().then(users => {
                    users.forEach(user => {
                        // For each user who reacted, check if they are not a bot and if they are missing the smokers club member role
                        if (!user.bot) {
                            const member = message.guild.members.cache.get(user.id);
                            if (member && !member.roles.cache.has(welcomeRoleId)) {
                                // Emit a custom event to add the role if not already assigned.
                                client.emit('messageReactionAdd', reaction, user);
                            }
                        }
                    });
                });
            });
        }
    }

    // Fetch the support ticket channel by ID
    const supportTicketChannel = await client.channels.fetch(supportTicketChannelId);
    if (supportTicketChannel) {
        // Fetch the support ticket message from the channel.
        const supportTicketMessage = await supportTicketChannel.messages.fetch(supportTicketMessageId);
        if (supportTicketMessage) {
            // Process existing reactions on the support ticket message.
            supportTicketMessage.reactions.cache.forEach(reaction => {
                reaction.users.fetch().then(users => {
                    users.forEach(user => {
                        // For each user who reacted, check if they are not a bot.
                        if (!user.bot) {
                            // Emit a custom event for support ticket reaction.
                            client.emit('messageReactionAdd', reaction, user);
                        }
                    });
                });
            });
        }
    }
});
