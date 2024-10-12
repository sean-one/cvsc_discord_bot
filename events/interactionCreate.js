const { Events, PermissionOverwrites } = require('discord.js');
const { SUPPORT_TICKET_MESSAGE } = require('../config.json')

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Handle Slash Commands
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
    
                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }
    
                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            }

            // Handle Button Interactions
            else if (interaction.isButton()) {
                // Check if the button clicked is the "Close Ticket" button
                if (interaction.customId === 'close_ticket') {
                    const { channel, user } = interaction;

                    // Parse the user ID from the channel name
                    const channelUserId = channel.name.split('-')[1];

                    // Check if the user who clicked the button is the ticket owner
                    if (user.id === channelUserId) {
                        await interaction.reply({ content: `Closing the ticket as requested by <@${user.id}` });

                        // Close (delete) the ticket channel
                        await channel.delete();

                        await user.send(`Your support ticket has been closed.\n\nIf this was in error or if you need to open another ticket, please follow the instructions in support channel.`)
                    } else {
                        await interaction.reply({ content: 'Only the ticket owner can close this ticket.', ephemeral: true });
                    }
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);

            // Handle error and send a reply if no response has been sent yet
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'An unexpected error occurred while processing your request.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'An unexpected error occurred while processing your request.', ephemeral: true });
            }
        }
    },
};
