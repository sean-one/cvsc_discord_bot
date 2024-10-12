const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MODERATOR_ROLE } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resolved')
        .setDescription('Mark a support ticket as resolved and notify the user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels) // Restrict to users with Manage Channels permission (e.g., moderators)
        .setDMPermission(false), // Only allow the command to be used in guilds, not in DMs

    async execute(interaction) {
        const { channel, client, user } = interaction;

        // Check if the command is being used in a support ticket channel
        if (!channel.name.startsWith('ticket-')) {
            await interaction.reply({ content: 'This command can only be used in support ticket channels.', ephemeral: true });
            return;
        }

        // Check if the user has the correct permissions
        const member = await channel.guild.members.fetch(user.id);

        if (!member.roles.cache.has(MODERATOR_ROLE)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        // Parse the user ID from the channel name (assuming the name is `ticket-userID`)
        const channelUserId = channel.name.split('-')[1];
        const ticketOwner = await client.users.fetch(channelUserId);

        // Create a 'Close Ticket' button
        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        // Create an action row to hold the button
        const row = new ActionRowBuilder().addComponents(closeButton);

        // Send a message in the support ticket channel to indicate the ticket has been resolved
        await interaction.reply({
            content: `Hello, <@${ticketOwner.id}>!\n\nYour support ticket has been marked as **resolved** by <@${user.id}>.\n\nIf you have any further questions or need additional assistance, feel free to open another ticket or ask here before the ticket is closed.`,
            components: [row],
        });
    },
};
