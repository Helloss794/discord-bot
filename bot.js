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

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle("🪖 MILITARY VERIFICATION SYSTEM")
            .setDescription(
                "🔐 Verify your Roblox account to unlock all features\n\nClick the button below."
            )
            .setColor(0x00b0ff);

        const button = new ButtonBuilder()
            .setCustomId("verify_btn")
            .setLabel("START VERIFY")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await channel.send({
            embeds: [embed],
            components: [row]
        });

    } catch (err) {
        console.log("Channel error:", err.message);
    }
});

// ===== AUTO ROLE =====
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const role = member.guild.roles.cache.get(UNVERIFY_ROLE_ID);
        if (role) await member.roles.add(role);
    } catch (err) {
        console.log(err.message);
    }
});

// ===== INTERACTION =====
client.on(Events.InteractionCreate, async (interaction) => {

    // ===== BUTTON =====
    if (interaction.isButton() && interaction.customId === "verify_btn") {

        if (cooldown.has(interaction.user.id)) {
            return interaction.reply({
                content: "⏳ Wait before trying again.",
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId("verify_modal")
            .setTitle("Roblox Verification");

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
            await interaction.editReply("🔍 Checking account...");

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

            // ===== MEMBER =====
            const member = await interaction.guild.members.fetch({
                user: interaction.user.id,
                force: true
            });

            const botMember = interaction.guild.members.me;

            // ===== PERMISSION CHECK =====
            if (!botMember.permissions.has("ManageNicknames")) {
                return interaction.editReply("❌ Bot missing **Manage Nicknames** permission.");
            }

            // ===== ROLE CHECK =====
            if (botMember.roles.highest.position <= member.roles.highest.position) {
                return interaction.editReply(
                    "❌ Cannot change nickname.\n\n👉 Move bot role ABOVE your role."
                );
            }

            // ===== NICKNAME =====
            let nickname = roleName === "Guest"
                ? username
                : `${username} | ${roleName}`;

            if (nickname.length > 32) {
                nickname = username.slice(0, 32);
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
                    "Nickname updated!"
                )
                .setColor(0x00ff99);

            return interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return interaction.editReply("❌ Error: " + err.message);
        }
    }
});

// ===== LOGIN =====
client.login(TOKEN);
