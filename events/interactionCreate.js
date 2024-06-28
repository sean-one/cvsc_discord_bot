const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ThreadAutoArchiveDuration } = require('discord.js');

// store open tickets count
const userOpenTickets = new Map();

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
                        for (const threadMessage of threadMessages.values()) {
                            await archivedThread.send({
                                content: threadMessage.content,
                                embeds: threadMessage.embeds,
                                attachments: threadMessage.attachments.map(attachment => attachment.url),
                            });
                        }

                        // remove the user from the logged thread
                        await archivedThread.members.remove(thread.ownerId)

                        // archive the original thread
                        await thread.setArchived(true);

                        // fetch the message with the button
                        const messageWithButton = await thread.messages.fetch({ limit: 1 });
                        const buttonMessage = messageWithButton.first();

                        if (buttonMessage) {
                            // create a new row with the disabled button
                            const updatedButtonRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('close_ticket')
                                        .setLabel('Close Ticket')
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true) // disable the button
                                );
                            
                            // edit the original message to disable the button
                            await buttonMessage.edit({ components: [updatedButtonRow] });
                        }

                        await interaction.reply({ content: 'this ticket has been closed', ephemeral: true });

                        // update the open tickets count
                        const userId = thread.ownerId;
                        const openTicketsCount = userOpenTickets.get(userId) || 1;
                        userOpenTickets.set(userId, openTicketsCount - 1);
                    }
                } else {
                    await interaction.reply({ content: 'this command can only be used in ticket threads', ephemeral: true });
                }
            }
        }
    },
};