const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ThreadAutoArchiveDuration } = require('discord.js');

// store timestamps and open ticket count
const userLastTicketTime = new Map();
const userOpenTickets = new Map();

// function to generate a timestamp string using Date.now()
function generateTimestamp() {
    return Date.now().toString();
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Create a new support ticket')
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Describe your issue or concern')
                .setRequired(true)
        ),
    async execute(interaction) {
        const description = interaction.options.getString('description');
        const user = interaction.user;
        const guild = interaction.guild;
        const userId = user.id;

        // check the last ticket creation time
        const now = Date.now();
        const lastTicketTime = userLastTicketTime.get(userId) || 0;
        const timeSinceLastTicket = now - lastTicketTime;
        const cooldownTime = 5 * 60 * 1000; // 5 minutes - minimum time between tickets created

        if (timeSinceLastTicket < cooldownTime) {
            const timeRemaining = Math.ceil((cooldownTime - timeSinceLastTicket) / 1000);
            return interaction.reply({ content: `you can create a new ticket in ${timeRemaining} seconds`, ephemeral: true });
        }

        // check the number of open tickets
        const maxOpenTickets = 5;
        const openTicketsCount = userOpenTickets.get(userId) || 0;
        
        if (openTicketsCount >= maxOpenTickets) {
            return interaction.reply({ content: `you alread have ${maxOpenTickets} open tickets. Please close an exisint completed ticekt before creating a new one`, ephemeral: true });
        }

        // define the support channel id
        const supportChannelId = '1255940842770792579';
        const supportChannel = await guild.channels.fetch(supportChannelId);

        if (!supportChannel) {
            return interaction.reply({ content: 'support channel not found', ephemeral: true });
        }

        // generate a unique thread name using a timestamp
        const threadName = `${userId}-ticket_${generateTimestamp()}`

        // create a thread in the support channel
        const ticketThread = await supportChannel.threads.create({
            name: threadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            reason: `support ticket for <@${userId}>`,
            type: ChannelType.PrivateThread,
        });

        // add the user to the thread
        await ticketThread.members.add(userId);

        // add the moderators to the thread
        const moderatorRoleId = '1255955254567243798';
        const moderators = guild.roles.cache.get(moderatorRoleId).members;
        moderators.forEach(async (moderator) => {
            await ticketThread.members.add(moderator.id);
        });

        // create a row of buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger),
            );
        
        // send a message to the thread with the close button
        await ticketThread.send({
            content: `ticket created by <@${user.id}>.\n\n**Description:** ${description}`,
            components: [row]
        });

        // confirm ticket creation to the user
        await interaction.reply({ content: `your ticket has been created: <#${ticketThread.id}>`, ephemeral: true });

        // update the last ticket creation time and open tickets count
        userLastTicketTime.set(userId, now);
        userOpenTickets.set(userId, openTicketsCount + 1);
    },
};