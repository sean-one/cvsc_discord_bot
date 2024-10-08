const { ChannelType, PermissionOverwrites, PermissionsBitField } = require('discord.js');
const {
    SMOKERS_CLUB_WELCOME_CH_ID,
    CVSC_LEAF_EMOJI_ID,
    CVSC_JOINT_EMOJI_ID,
    ROLE_ACCESS_MESSAGE,
    SUPPORT_TICKET_MESSAGE,
    SUPPORT_TICKET_CATEGORY_ID,
    MODERATOR_ROLE,
    SMOKERS_CLUB_MEMBER_ROLE
} = require('../config.json')

module.exports = {
    name: 'messageReactionAdd',

    async execute(reaction, user) {
        console.log(`Reaction added by ${user.tag} on message ${reaction.message.id}`);

        // Ignore reactsion made by bots.
        if (user.bot) return

        // Check for Support Ticket Reaction
        if (reaction.message.id === SUPPORT_TICKET_MESSAGE && reaction.emoji.id === CVSC_JOINT_EMOJI_ID) {
            await handleSupportTicketReaction(reaction, user);
        }

        // Check for Welcome Role Reaction
        if (reaction.message.id === ROLE_ACCESS_MESSAGE && reaction.emoji.id === CVSC_LEAF_EMOJI_ID) {
            await handleWelcomeRoleReaction(reaction, user);
        }
    }
}

// Separate function for handling support ticket reactions
async function handleSupportTicketReaction(reaction, user) {
    console.log('Support ticket reaction triggered');

    // Remove the users reaction to indicate it was received
    await reaction.users.remove(user.id);

    // Check if the support category exists.
    const supportCategory = reaction.message.guild.channels.cache.get(SUPPORT_TICKET_CATEGORY_ID);
    if (!supportCategory) {
        console.error('Support category not found.');
        return;
    }

    // Check if the user already has an existing ticket channel.
    const existingChannel = reaction.message.guild.channels.cache.find(
        channel => channel.parentId === supportCategory.id && channel.name === `ticket-${user.id}`
    );

    if (existingChannel) {
        await user.send(`You already have an open support ticket: <#${existingChannel.id}>.  Please use that channel for further queries.`);
        return;
    }

    // Create a new private support ticket channel for the user.
    const ticketChannel = await reaction.message.guild.channels.create({
        name: `ticket-${user.id}`,
        type: ChannelType.GuildText,
        parent: supportCategory.id,
        topic: `Support ticket for ${user.tag}`,
        permissionOverwrites: [
            {
                id: reaction.message.guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ],
            },
            {
                id: MODERATOR_ROLE,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            },
        ],
    });

    await ticketChannel.send(`Hello, <@${user.id}>!  Thank you for reaching out to support.\n\nPlease describe your issue or question in detail and a moderator will be in contact with you via this private chat channel.`);
    await user.send(`Your support ticket has been created: <#${ticketChannel.id}>.`);
}


// Separate function for handling welcome role reactions
async function handleWelcomeRoleReaction(reaction, user) {
    console.log('Welcome role reaction triggered');

    // Fetch the member object corresponding to the user who reacted.
    const member = reaction.message.guild.members.cache.get(user.id);
    const role = reaction.message.guild.roles.cache.get(SMOKERS_CLUB_MEMBER_ROLE);

    // Check if the user already has teh role
    if (role && member.roles.cache.has(SMOKERS_CLUB_MEMBER_ROLE)) {
        console.log(`user ${user.tag} already has the '${role.name}' role`);
        return;
    }

    // Add the role to the user.
    if (role) {
        await member.roles.add(role);
        console.log(`Assigned role '${role.name}' to user ${user.tag}`);

        // Select a random welcome message and replace placeholder with members mention.
        const welcomeMessages = [
            "🚀 Puff Puff Pass, everyone! <@{member}> is here! Grab your favorite strain and enjoy the vibe. 🌿🔥",
            "🍕 Munchies Alert! Hey, everyone, <@{member}> has arrived! Stock up on snacks and get ready for fun times. 🌿🍔",
            "🌿 420 Friendly Vibes Only! Look who just rolled in, <@{member}> is here! Kick back, light up, and chill out. 🔥🍃",
            "🎉 Rolling with the Homies! Attention everyone, <@{member}> has joined the party! Let's roll one up and enjoy the good vibes. 🌿💨",
            "🌈 High Times Ahead! Heads up, everyone, <@{member}> is here! Get ready for good times and great smoke sessions. 🌿🚀",
            "🔥 Look out, <@{member}> has arrived! Welcome to the sesh! Get comfy, light up, and enjoy the laid-back atmosphere. 🌿💨",
            "🌟 Big News! <@{member}> has entered the building! Join us in welcoming them and enjoy the ride. 🌿🎉",
            "🎉 Party Alert! <@{member}> just pulled up! Let's welcome them with open arms and plenty of good vibes. 🌿🔥",
            "💨 Fresh Arrival! Everyone, <@{member}> just stepped in! Kick back, relax, and light up. Let's enjoy the sesh together. 🌿🍃",
            "🎊 Special Announcement! <@{member}> has joined the crew! Grab your favorite strain and settle in for some high times. 🌿🚀",
            "🍁 Heads Up! <@{member}> has just landed! Get your favorite strain, light up, and enjoy. High times ahead! 🌿✨",
            "🔥 Smoke Session Alert! <@{member}> is here! Roll one up, sit back, and relax. Let's make it a lit session! 🌿💫",
            "🌿 Green Greetings! Everyone, <@{member}> has just arrived! Light up and chill with us. 🌿🎈",
            "🎉 Join the Fun! <@{member}> is here! Grab your stash and let's get started. Welcome to the sesh! 🌿🥳",
            "🌈 Vibe Check! <@{member}> has entered! Get ready for good times and great smoke. High vibes only! 🌿🚀",
            "💨 Smoke Alert! <@{member}> just rolled up! Grab your favorite strain and relax. Let's enjoy the vibes together. 🌿🔥",
            "🎊 High Arrival! <@{member}> has joined us! Light up, kick back, and enjoy the community. Welcome to the high life! 🌿🌟",
            "🔥 Blaze Alert! Everyone, <@{member}> is here! Let's welcome them with open arms and lit joints. 🌿💨",
            "🌿 New Arrival! <@{member}> has just stepped in! Light up and enjoy the vibes. High times ahead! 🌿✨",
            "🎉 Celebration Time! <@{member}> has arrived! Grab your stash and let's get started. Welcome to the party! 🌿🥳"
        ];
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)].replace('{member}', user.id);

        // Fetch the welcome channel and send the welcome message.
        const smokersClubWelcomeChannel = reaction.message.guild.channels.cache.get(SMOKERS_CLUB_WELCOME_CH_ID);
        if (smokersClubWelcomeChannel) {
            await smokersClubWelcomeChannel.send(randomMessage);
        } else {
            console.error(`Smokers club welcome channel not found`);
        }
    } else {
        console.error('Role not found');
    }
}