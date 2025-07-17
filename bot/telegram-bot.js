#!/usr/bin/env node

/**
 * Standalone Telegram Bot Service for Neo Shop
 * Handles all Telegram communications and notifications
 */

import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';

// Initialize Prisma client
const prisma = new PrismaClient();

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env file if it exists
try {
  dotenv.config({ path: join(__dirname, '../.env') });
  console.log('📝 Loaded .env file');
} catch (error) {
  console.log('📝 No .env file found, using container environment variables');
}

// Debug environment variables
console.log('🔍 Environment check:');
console.log('- TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- TELEGRAM_ADMIN_CHAT_ID:', process.env.TELEGRAM_ADMIN_CHAT_ID ? '✅ Set' : '❌ Missing');
console.log('- TELEGRAM_ADMIN_GROUP_ID:', process.env.TELEGRAM_ADMIN_GROUP_ID ? '✅ Set' : '❌ Missing');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

class NeoTelegramBot {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    this.adminGroupId = process.env.TELEGRAM_ADMIN_GROUP_ID;
    this.httpServer = null;
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured in environment');
      process.exit(1);
    }

    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    this.setupHandlers();
    this.setupHttpServer();
  }

  setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      console.log(`👋 Start command from ${username} (${chatId})`);
      
      const welcomeMessage = `🤖 Welcome to Neo Shop Bot!

I'm here to send you payment notifications and updates.

Available commands:
/balance - Check your balance
/help - Show this help message
/link - Link your account
/unlink - Unlink your account

Your Chat ID: \`${chatId}\``;

      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const helpMessage = `🤖 Neo Shop Bot Commands:

/start - Get started with the bot
/balance - Check your account balance
/link - Link your Telegram to your Neo Shop account
/unlink - Unlink your account
/status - Check bot status
/help - Show this help message

📧 Support: ${process.env.TELEGRAM_SUPPORT_CONTACT || '@support'}`;

      await this.bot.sendMessage(msg.chat.id, helpMessage);
    });

    // Handle /balance command
    this.bot.onText(/\/balance/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;

      if (!username) {
        await this.bot.sendMessage(chatId, '❌ You need to set a Telegram username to use this feature.');
        return;
      }

      try {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { telegram: username },
              { telegram: `@${username}` },
              { telegramId: chatId.toString() }
            ]
          },
          select: {
            username: true,
            balance: true,
            telegram: true
          }
        });

        if (!user) {
          await this.bot.sendMessage(chatId, '❌ Account not found. Please link your account first with /link command.');
          return;
        }

        const balanceMessage = `💰 Account Balance

👤 Username: ${user.username}
💵 Balance: $${user.balance.toFixed(2)}
🔗 Linked: ${user.telegram || 'Not set'}

Use our website to top up your balance!`;

        await this.bot.sendMessage(chatId, balanceMessage);
      } catch (error) {
        console.error('Error fetching balance:', error);
        await this.bot.sendMessage(chatId, '❌ Error fetching balance. Please try again later.');
      }
    });

    // Handle /link command
    this.bot.onText(/\/link/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;

      if (!username) {
        await this.bot.sendMessage(chatId, '❌ You need to set a Telegram username to link your account.');
        return;
      }

      try {
        // Check if user exists with this username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { telegram: username },
              { telegram: `@${username}` }
            ]
          }
        });

        if (user) {
          // Update the user's telegram ID
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramId: chatId.toString(),
              telegramLinked: true
            }
          });

          await this.bot.sendMessage(chatId, `✅ Account linked successfully!

👤 Username: ${user.username}
📱 Telegram: @${username}
🆔 Chat ID: ${chatId}

You will now receive payment notifications here.`);
        } else {
          await this.bot.sendMessage(chatId, `❌ No account found with Telegram username @${username}.

Please make sure:
1. You have a Neo Shop account
2. Your Telegram username is set in your profile
3. You're using the correct username

If you need help, contact ${process.env.TELEGRAM_SUPPORT_CONTACT || '@support'}`);
        }
      } catch (error) {
        console.error('Error linking account:', error);
        await this.bot.sendMessage(chatId, '❌ Error linking account. Please try again later.');
      }
    });

    // Handle /unlink command
    this.bot.onText(/\/unlink/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const user = await prisma.user.findFirst({
          where: { telegramId: chatId.toString() }
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramId: null,
              telegramLinked: false
            }
          });

          await this.bot.sendMessage(chatId, '✅ Account unlinked successfully. You will no longer receive notifications.');
        } else {
          await this.bot.sendMessage(chatId, '❌ No linked account found.');
        }
      } catch (error) {
        console.error('Error unlinking account:', error);
        await this.bot.sendMessage(chatId, '❌ Error unlinking account. Please try again later.');
      }
    });

    // Handle /status command (admin only)
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (chatId.toString() !== this.adminChatId) {
        await this.bot.sendMessage(chatId, '❌ This command is only available to administrators.');
        return;
      }

      try {
        const stats = await this.getSystemStats();
        const statusMessage = `🤖 Neo Shop Bot Status

📊 System Statistics:
👥 Total Users: ${stats.totalUsers}
🔗 Linked Accounts: ${stats.linkedUsers}
💰 Recent Payments (24h): ${stats.recentPayments}
💵 Total Volume (24h): $${stats.totalVolume.toFixed(2)}

⚙️ Bot Configuration:
🤖 Bot Token: ✅ Configured
👤 Admin Chat: ${this.adminChatId ? '✅' : '❌'} ${this.adminChatId || 'Not set'}
👥 Admin Group: ${this.adminGroupId ? '✅' : '❌'} ${this.adminGroupId || 'Not set'}

🟢 Bot is running normally`;

        await this.bot.sendMessage(chatId, statusMessage);
      } catch (error) {
        console.error('Error getting status:', error);
        await this.bot.sendMessage(chatId, '❌ Error fetching status.');
      }
    });

    // Error handling
    this.bot.on('error', (error) => {
      console.error('❌ Telegram Bot Error:', error);
    });

    // Polling error handling
    this.bot.on('polling_error', (error) => {
      console.error('❌ Telegram Polling Error:', error);
    });

    console.log('🤖 Telegram Bot handlers set up successfully');
  }

  async getSystemStats() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalUsers, linkedUsers, recentPayments, totalVolumeResult] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { telegramLinked: true } }),
      prisma.topUp.count({
        where: {
          completed: true,
          createdAt: { gte: twentyFourHoursAgo }
        }
      }),
      prisma.topUp.aggregate({
        where: {
          completed: true,
          createdAt: { gte: twentyFourHoursAgo }
        },
        _sum: { amount: true }
      })
    ]);

    return {
      totalUsers,
      linkedUsers,
      recentPayments,
      totalVolume: totalVolumeResult._sum.amount || 0
    };
  }

  setupHttpServer() {
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        botRunning: this.isRunning,
        timestamp: new Date().toISOString()
      });
    });

    // Notification endpoint
    app.post('/send-notification', async (req, res) => {
      try {
        const { type, message, username } = req.body;

        if (!type || !message) {
          return res.status(400).json({ error: 'Missing type or message' });
        }

        switch (type) {
          case 'admin':
            await this.sendToAdmin(message);
            break;
          case 'group':
            await this.sendToGroup(message);
            break;
          case 'user':
            if (!username) {
              return res.status(400).json({ error: 'Username required for user notifications' });
            }
            await this.sendToUserByUsername(username, message);
            break;
          default:
            return res.status(400).json({ error: 'Invalid notification type' });
        }

        res.json({ success: true, message: 'Notification sent' });
      } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
      }
    });

    const port = process.env.BOT_PORT || 3001;
    this.httpServer = app.listen(port, '0.0.0.0', () => {
      console.log(`🌐 Bot HTTP server listening on port ${port}`);
    });
  }

  async sendToUserByUsername(username, message) {
    try {
      console.log(`🔍 Looking for user with Telegram username: @${username}`);
      
      // Try to find user's chat ID in database
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { telegram: username },
            { telegram: `@${username}` }
          ]
        },
        select: { telegramId: true, username: true, telegram: true, telegramLinked: true }
      });

      console.log(`🔍 User lookup result:`, user);

      if (user?.telegramId && user.telegramLinked) {
        await this.sendMessage(user.telegramId, message);
        console.log(`📱 Message sent to @${username} (${user.username}) at chat ID ${user.telegramId}`);
      } else if (user && !user.telegramLinked) {
        console.log(`📱 [USER @${username} - Found but not linked] User exists but hasn't linked their account`);
      } else if (user && !user.telegramId) {
        console.log(`📱 [USER @${username} - No Chat ID] User found but no Telegram chat ID stored`);
      } else {
        console.log(`📱 [USER @${username} - Not Found] No user found with this Telegram username`);
      }
    } catch (error) {
      console.error(`❌ Failed to send message to user @${username}:`, error);
      throw error;
    }
  }

  async sendMessage(chatId, message, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, message, options);
    } catch (error) {
      console.error(`❌ Failed to send message to ${chatId}:`, error);
      throw error;
    }
  }

  async sendToAdmin(message) {
    if (this.adminChatId) {
      try {
        await this.sendMessage(this.adminChatId, message);
        console.log('📱 Admin notification sent');
      } catch (error) {
        console.error('❌ Failed to send admin notification:', error);
      }
    } else {
      console.log('📱 [ADMIN] ' + message);
    }
  }

  async sendToGroup(message) {
    if (this.adminGroupId) {
      try {
        await this.sendMessage(this.adminGroupId, message);
        console.log('📱 Group notification sent');
      } catch (error) {
        console.error('❌ Failed to send group notification:', error);
      }
    } else {
      console.log('📱 [GROUP] ' + message);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Bot is already running');
      return;
    }

    try {
      console.log('🚀 Starting Neo Telegram Bot...');
      
      // Test bot connection
      const me = await this.bot.getMe();
      console.log(`✅ Bot connected successfully: @${me.username} (${me.first_name})`);
      
      // Send startup notification to admin
      if (this.adminChatId) {
        await this.sendToAdmin(`🤖 Neo Shop Bot Started

Bot: @${me.username}
Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}

Bot is now ready to handle notifications!`);
      }

      this.isRunning = true;
      console.log('🤖 Neo Telegram Bot is running...');
      
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Neo Telegram Bot...');
    
    if (this.adminChatId) {
      await this.sendToAdmin('🛑 Neo Shop Bot Stopping\n\nBot service is shutting down.');
    }

    await this.bot.stopPolling();
    
    if (this.httpServer) {
      this.httpServer.close();
      console.log('🌐 HTTP server stopped');
    }
    
    this.isRunning = false;
    console.log('✅ Bot stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (global.neoBot) {
    await global.neoBot.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (global.neoBot) {
    await global.neoBot.stop();
  }
  process.exit(0);
});

// Start the bot
async function main() {
  console.log('🚀 Initializing Neo Telegram Bot Service...');
  
  global.neoBot = new NeoTelegramBot();
  await global.neoBot.start();
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default NeoTelegramBot;
