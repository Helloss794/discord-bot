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

// ===== COOLDOWN =====
const cooldown = new Map();

// ===== READY =====
client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== AUTO ROLE =====
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const role = member.guild.roles.cache.get(UNVERIFY_ROLE_ID);
        if (role) await member.roles.add(role);
    } catch (err) {
        console.log("Join role error:", err.message);
    }
});

// ===== INTERACTION =====
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
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
    }

    // ===== MODAL =====
    if (interaction.isModalSubmit() && interaction.customId === "verify_modal") {

        const username = interaction.fields.getTextInputValue("username");

        cooldown.set(interaction.user.id, Date.now());
        setTimeout(() => cooldown.delete(interaction.user.id), 10000);

        await interaction.deferReply({ ephemeral: true });

        try {
            await interaction.editReply("🔍 Checking Roblox account...");

            // ===== ROBLOX USER =====
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernames: [username] })
            });

            const userData = await userRes.json();

            if (!userData.data || userData.data.length === 0) {
                return interaction.editReply("❌ Username not found");
            }

            const userId = userData.data[0].id;

            // ===== GROUP =====
            const groupRes = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
            const groupData = await groupRes.json();

            let roleName = "Guest";

            if (groupData.data) {
                const found = groupData.data.find(g =>
                    String(g.group.id) === String(GROUP_ID)
                );
                if (found) roleName = found.role.name;
            }

            // ===== MEMBER FETCH (FORCE) =====
            const member = await interaction.guild.members.fetch({
                user: interaction.user.id,
                force: true
            });

            // ===== DEBUG =====
            const botMember = interaction.guild.members.me;

            console.log("====== DEBUG ======");
            console.log("Bot highest:", botMember.roles.highest.position);
            console.log("User highest:", member.roles.highest.position);
            console.log("Manageable:", member.manageable);

            // ===== NICKNAME =====
            let nickname = roleName === "Guest"
                ? username
                : `${username} | ${roleName}`;

            if (nickname.length > 32) {
                nickname = username.slice(0, 32);
            }

            // ===== FAIL CHECK =====
            if (!member.manageable) {
                return interaction.editReply(
                    "❌ Cannot change nickname.\n\n" +
                    "👉 Fix this:\n" +
                    "- Move bot role ABOVE all roles\n" +
                    "- Make sure bot has Manage Nicknames\n" +
                    "- You are not server owner"
                );
            }

            // ===== SET NICKNAME =====
            await member.setNickname(nickname);

            // ===== ROLES =====
            const verifyRole = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
            const unverifyRole = interaction.guild.roles.cache.get(UNVERIFY_ROLE_ID);

            if (verifyRole) await member.roles.add(verifyRole);
            if (unverifyRole) await member.roles.remove(unverifyRole);

            // ===== SUCCESS =====
            const embed = new EmbedBuilder()
                .setTitle("✅ VERIFIED")
                .setDescription(
                    `👤 Username: **${username}**\n` +
                    `🎖 Rank: **${roleName}**\n\n` +
                    "Nickname updated successfully!"
                )
                .setColor(0x00ff99);

            return interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return interaction.editReply("❌ Error occurred.");
        }
    }
});

// ===== LOGIN =====
client.login(TOKEN);
