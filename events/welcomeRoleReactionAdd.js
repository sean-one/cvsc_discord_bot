const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        console.log('message reaction triggered')
        // Ignore bot reactions
        if (user.bot) return;

        // define the roles channel ID and the emoji for agreement
        const welcomeRoleReactionMessageId = '1245836542895849512';
        const agreementEmoji = '1245851484654932120';
        const memberRoleId = '1245857560746004500';

        const smokersClubWelcomeChannelId = '1255569055188779018';

        // Your list of welcome messages
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

        // check if the react is in the roles channel and is the correct emoji
        if (reaction.message.id === welcomeRoleReactionMessageId && reaction.emoji.id === agreementEmoji) {
            // get the member who reacted
            const member = reaction.message.guild.members.cache.get(user.id);

            // add the role to the member
            const role = reaction.message.guild.roles.cache.get(memberRoleId);
            if (role && member.roles.cache.has(memberRoleId)) {
                console.log(`User ${user.tag} already has the '${role.name}' role`);
                return; // early return if the user already has the role
            }

            if (role) {
                await member.roles.add(role);
                console.log(`assigned role '${role.name}' to user ${user.tag}`);

                // select a random welcome message
                const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
                    .replace('{member}', member.id)
                
                // send the welcome message in the smokers-club-welcome
                const smokersClubWelcomeChannel = reaction.message.guild.channels.cache.get(smokersClubWelcomeChannelId);
                if (smokersClubWelcomeChannel) {
                    await smokersClubWelcomeChannel.send(randomMessage);
                } else {
                    console.error('smokers club welcome channel not found');
                }
            } else {
                console.error('role not found');
            }
        }
    },
};