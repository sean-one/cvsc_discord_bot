const { Events, ChannelType, ThreadAutoArchiveDuration, ButtonStyle, ButtonBuilder, ActionRowBuilder, PermissionOverwrites } = require('discord.js');
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
        } else if (interaction.isButton() && interaction.customId === 'close_ticket') {
            const thread = interaction.channel;
            if (thread.isThread()) {
                try {
                    // Defer interaction reply
                    await interaction.deferReply({ ephemeral: true });

                    const guild = interaction.guild;
                    const archiveChannelId = '1256121241819943018';
                    const archiveChannel = await guild.channels.fetch(archiveChannelId);

                    if (!archiveChannel) {
                        console.error('Archive channel not found');
                        await interaction.editReply({ content: 'Archive channel not found.' });
                        return;
                    }

                    console.log('Creating archived thread');
                    const archivedThread = await archiveChannel.threads.create({
                        name: thread.name,
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                        type: ChannelType.PrivateThread,
                        reason: `Archived ticket for ${thread.name}`,
                    });

                    const threadMessages = await thread.messages.fetch({ limit: 100 });
                    const sortedMessages = threadMessages
                        .filter(msg => !msg.system) // Filter out system messages
                        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

                    let ticketCreatorId;
                    for (const threadMessage of sortedMessages.values()) {
                        const messageContent = {
                            content: `**${threadMessage.author.username}**: ${threadMessage.content}`,
                            embeds: threadMessage.embeds,
                            files: threadMessage.attachments.map(attachment => attachment.url),
                        };

                        if (messageContent.content || messageContent.embeds.length > 0 || messageContent.files.length > 0) {
                            console.log('Sending message:', messageContent);
                            await archivedThread.send(messageContent);
                        }

                        const creatorMatch = threadMessage.content.match(/\*\*Ticket Creator:\*\* <@(\d+)>/);
                        if (creatorMatch) {
                            ticketCreatorId = creatorMatch[1];
                        }
                    }

                    if (ticketCreatorId) {
                        await archivedThread.members.remove(ticketCreatorId);
                    }

                    console.log('Updating open tickets count');
                    const openTicketsCount = userOpenTickets.get(ticketCreatorId) || 1;
                    userOpenTickets.set(ticketCreatorId, openTicketsCount - 1);

                    if (userOpenTickets.get(ticketCreatorId) <= 0) {
                        userOpenTickets.delete(ticketCreatorId);
                    }

                    updateState();

                    // create new action row with the delete button
                    const deleteActionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('delete_thread')
                            .setLabel('Delete Thread')
                            .setStyle(ButtonStyle.Danger)
                    );

                    console.log('Sending notification in the original thread');
                    await thread.send({
                        content: 'This ticket has been marked as resolved and archived. You can delete this thread if you no longer need it.',
                        components: [deleteActionRow],
                    });

                    await thread.setLocked(true);

                    console.log('Editing interaction reply');
                    await interaction.editReply({ content: 'This ticket has been closed and logged.' });

                } catch (error) {
                    console.error('Error handling the interaction: ', error);

                    try {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp({ content: 'There was an error closing the ticket. Please try again later.', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'There was an error closing the ticket. Please try again later.', ephemeral: true });
                        }
                    } catch (followUpError) {
                        console.error('Error sending follow-up: ', followUpError);
                    }
                }
            } else {
                try {
                    await interaction.reply({ content: 'This command can only be used in ticket threads.', ephemeral: true });
                } catch (replyError) {
                    console.error('Error replying to interaction: ', replyError);
                }
            }
        } else if (interaction.isButton() && interaction.customId === 'delete_thread') {
            const thread = interaction.channel;
            if (thread.isThread()) {
                try {
                    await thread.delete();
                    await interaction.reply({ content: 'the thread has been successfully deleted', ephemeral: true });
                } catch (error) {
                    console.error('error deleting the thread: ', error);
                    await interaction.reply({ content: 'there was an error deleting the thread. please try again later.', ephemeral: true });
                }
            } else {
                try {
                    await interaction.reply({ content: 'this command can only be used in threads', ephemeral: true });
                } catch (replyError) {
                    console.error('error replying to interaction: ', replyError);
                }
            }
        }
    },
};
