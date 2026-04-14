require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;
const UNVERIFY_ROLE_ID = process.env.UNVERIFY_ROLE_ID;

const GROUP_ID = 255794288;

// ===== SIMPLE COOLDOWN =====
const cooldown = new Map();

// ===== READY =====
client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle("🪖 MILITARY VERIFICATION SYSTEM")
        .setDescription(
            "```ansi\n[2;36mSecure Access Required[0m\n```\n" +
            "🔐 Verify your Roblox account to unlock all features\n\n" +
            "Click the button below to start verification."
        )
        .setColor(0x00b0ff)
        .setFooter({ text: "Verification System • Secure Access" });

    const button = new ButtonBuilder()
        .setCustomId("verify_btn")
        .setLabel("START VERIFY")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🚀");

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
        embeds: [embed],
        components: [row]
    });
});

// ===== JOIN ROLE =====
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const role = member.guild.roles.cache.get(UNVERIFY_ROLE_ID);
        if (role) await member.roles.add(role);
    } catch (err) {
        console.log("Join role error:", err.message);
    }
});

// ===== INTERACTIONS =====
client.on(Events.InteractionCreate, async (interaction) => {

    // ===== BUTTON =====
    if (interaction.isButton() && interaction.customId === "verify_btn") {

        if (cooldown.has(interaction.user.id)) {
            return interaction.reply({
                content: "⏳ Please wait before verifying again.",
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId("verify_modal")
            .setTitle("🪖 Roblox Verification");

        const input = new TextInputBuilder()
            .setCustomId("username")
            .setLabel("Roblox Username")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Enter your Roblox username")
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
    }

    // ===== MODAL =====
    if (interaction.isModalSubmit() && interaction.customId === "verify_modal") {

        const username = interaction.fields.getTextInputValue("username");

        cooldown.set(interaction.user.id, Date.now());
        setTimeout(() => cooldown.delete(interaction.user.id), 10000);

        await interaction.deferReply({ ephemeral: true });

        try {
            // ===== LOADING UI =====
            await interaction.editReply("🔍 Checking Roblox account...");

            // ===== ROBLOX USER =====
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernames: [username] })
            });

            const userData = await userRes.json();

            if (!userData.data || userData.data.length === 0) {
                return interaction.editReply("❌ Roblox username not found");
            }

            const userId = userData.data[0].id;

            // ===== GROUP CHECK =====
            const groupRes = await fetch(
                `https://groups.roblox.com/v1/users/${userId}/groups/roles`
            );

            const groupData = await groupRes.json();

            let roleName = "Guest";

            if (groupData.data) {
                const found = groupData.data.find(g =>
                    String(g.group.id) === String(GROUP_ID)
                );
                if (found) roleName = found.role.name;
            }

            // ===== MEMBER =====
            const member = await interaction.guild.members.fetch(interaction.user.id);

            // ===== COOL NICKNAME STYLE =====
            let nickname = `${username} | ${roleName}`;

            if (roleName !== "Guest") {
                nickname = `${username} | ${roleName}`;
            }

            // LIMIT SAFE
            if (nickname.length > 32) {
                nickname = `${username} | ${roleName}`;
                if (nickname.length > 32) {
                    nickname = username.slice(0, 32);
                }
            }

            try {
                await member.setNickname(nickname);
            } catch (err) {
                console.log("Nickname error:", err.message);
            }

            // ===== ROLES =====
            const verifyRole = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
            const unverifyRole = interaction.guild.roles.cache.get(UNVERIFY_ROLE_ID);

            if (verifyRole) await member.roles.add(verifyRole);
            if (unverifyRole) await member.roles.remove(unverifyRole);

            // ===== SUCCESS EMBED =====
            const success = new EmbedBuilder()
                .setTitle("✅ VERIFIED SUCCESSFULLY")
                .setDescription(
                    "```ansi\n[2;32mACCESS GRANTED[0m\n```\n" +
                    `👤 Username: **${username}**\n` +
                    `🎖 Rank: **${roleName}**\n\n` +
                    "Welcome to the server!"
                )
                .setColor(0x00ff99)
                .setFooter({ text: "System Verified ✔" });

            return interaction.editReply({ content: "", embeds: [success] });

        } catch (err) {
            console.error(err);
            return interaction.editReply("❌ Verification failed. Try again.");
        }
    }
});

client.login(TOKEN);
