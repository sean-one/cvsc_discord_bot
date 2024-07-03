const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ThreadAutoArchiveDuration } = require('discord.js');
const { userOpenTickets, updateState } = require('../botState');


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
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
        } else if (interaction.isButton()) {
            // close support ticket private thread
            if (interaction.customId === 'close_ticket') {
                const thread = interaction.channel;
                if (thread.isThread()) {
                    if (thread.archived) {
                        await interaction.reply({ content: 'this ticket is already closed', ephemeral: true });
                    } else {
                        const guild = interaction.guild;

                        // define the archive channel id
                        const archiveChannelId = '1256121241819943018';
                        const archiveChannel = await guild.channels.fetch(archiveChannelId);

                        if (!archiveChannel) {
                            return interaction.reply({ content: `archive channel not found`, ephemeral: true });
                        }

                        // clone the thread in the archive channel
                        const archivedThread = await archiveChannel.threads.create({
                            name: thread.name,
                            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                            type: ChannelType.PrivateThread,
                            reason: `archived ticket for ${thread.name}`,
                        });

                        // copy the messages from the orginal thread to teh archived thread
                        const threadMessages = await thread.messages.fetch({ limit: 100 });
                        let ticketCreatorId;
                        for (const threadMessage of threadMessages.values()) {
                            const messageContent = {
                                content: threadMessage.content,
                                embeds: threadMessage.embeds,
                                attachments: threadMessage.attachments.map(attachment => attachment.url),
                            }

                            // check if at least one field has content
                            if (messageContent.content || messageContent.embeds.length > 0 || messageContent.attachments.length > 0) {
                                await archivedThread.send(messageContent)
                            }

                            // extract the ticket creator ID from the initial message
                            const creatorMatch = threadMessage.content.match(/\*\*Ticket Creator:\*\* <@(\d+)>/)
                            if (creatorMatch) {
                                ticketCreatorId = creatorMatch[1];
                            }
                        }

                        // remove the user who created the ticket from the logged thread
                        if (ticketCreatorId) {
                            await archivedThread.members.remove(ticketCreatorId);
                        }

                        // archive the original thread
                        await thread.setArchived(true);
                        await thread.delete();

                        await interaction.reply({ content: 'this ticket has been closed and logged', ephemeral: true });
                        
                        // update the open tickets count
                        const openTicketsCount = userOpenTickets.get(ticketCreatorId) || 1;
                        userOpenTickets.set(ticketCreatorId, openTicketsCount - 1);

                        // ensure the count doesnt go negative
                        if (userOpenTickets.get(ticketCreatorId) <= 0) {
                            userOpenTickets.delete(ticketCreatorId);
                        }

                        // save the updated bot state
                        updateState();
                    }
                } else {
                    await interaction.reply({ content: 'this command can only be used in ticket threads', ephemeral: true });
                }
            }
        }
    },
};