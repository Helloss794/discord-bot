# 🪖 Military Verification Bot

A powerful Discord bot that verifies Roblox users and gives roles automatically based on group rank.

---

## ✨ Features

* 🔐 Roblox username verification
* 🎖 Auto fetch Roblox group rank
* 👤 Auto nickname system (`✪ username • rank`)
* ✅ Gives verified role
* ❌ Removes unverified role
* ⚡ Cool UI (buttons + modal)
* 🛡 Anti-spam cooldown
* 🌐 24/7 hosting ready (Railway / VPS)

---

## 📦 Requirements

* Node.js **v18+**
* Discord Bot Token
* Roblox Group ID

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

---

### 2. Create `.env` file

```env
TOKEN=your_bot_token
CHANNEL_ID=your_channel_id
VERIFY_ROLE_ID=your_verify_role_id
UNVERIFY_ROLE_ID=your_unverify_role_id
```

---

### 3. Run the bot

```bash
node bot.js
```

---

## 🚀 Deploy (24/7 Online)

Recommended: Deploy using Railway

* Push project to GitHub
* Deploy on Railway
* Add ENV variables
* Done ✅

---

## 🔑 Permissions Required

Make sure your bot has:

* Manage Roles
* Manage Nicknames
* Send Messages
* Use Slash Commands

⚠️ Bot role must be ABOVE:

* Verify role
* Unverified role

---

## 🧠 How It Works

1. User clicks **Verify button**
2. Enters Roblox username
3. Bot checks Roblox API
4. Gets group rank
5. Sets nickname
6. Gives verified role
7. Removes unverified role

---

## ⚠️ Notes

* Nickname limit = 32 characters (auto handled)
* Cooldown = 10 seconds
* Works only if user is in the Discord server

---

## 📁 Project Structure

```
bot/
 ├── bot.js
 ├── package.json
 ├── .env (not uploaded)
 └── node_modules/
```

---

## 💡 Future Upgrades

* 🔐 Real Roblox code verification (anti fake users)
* 📊 Logging system
* 💾 Database support
* 🌐 Web dashboard
* 🎖 Auto rank sync

---

## 👑 Credits

Developed by you + ChatGPT 🚀

---

## 📜 License

MIT License
