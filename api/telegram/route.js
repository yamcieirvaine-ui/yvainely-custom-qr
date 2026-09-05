import { Bot, webhookCallback, InlineKeyboard, InputFile } from "grammy";
import sharp from "sharp";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is missing");
}

const bot = new Bot(token);

const sessions =
  globalThis.__qrSessions ?? (globalThis.__qrSessions = new Map());

function menu() {
  return new InlineKeyboard()
    .text("🎀 Coquette", "design:coquette")
    .text("🖤 Gothic", "design:gothic")
    .row()
    .text("🤍 Minimal", "design:minimal")
    .text("🌸 Pink", "design:pink");
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[c]));
}

bot.command("start", async (ctx) => {
  sessions.set(ctx.from.id, {});
  await ctx.reply(
    "♡ CUSTOM QR BOT ♡\n\n" +
    "Send your bank / QRPh QR image.\n\n" +
    "The original QR pattern is kept intact. " +
    "The bot only places it inside a custom design."
  );
});

bot.command("cancel", async (ctx) => {
  sessions.delete(ctx.from.id);
  await ctx.reply("Cancelled ♡ Send /start to begin again.");
});

bot.on("message:photo", async (ctx) => {
  try {
    const photo = ctx.message.photo.at(-1);
    const file = await ctx.api.getFile(photo.file_id);

    if (!file.file_path) {
      await ctx.reply("I couldn't download that QR. Please send it again. ♡");
      return;
    }

    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Telegram file download failed");
    }

    const qrBuffer = Buffer.from(await response.arrayBuffer());

    const session = sessions.get(ctx.from.id) ?? {};
    session.qr = qrBuffer;
    session.name = undefined;
    sessions.set(ctx.from.id, session);

    await ctx.reply(
      "QR received ♡\n\nNow send the name you want to appear on the design."
    );
  } catch (error) {
    console.error(error);
    await ctx.reply(
      "Something went wrong while reading the QR. Please try again. ♡"
    );
  }
});

bot.on("message:text", async (ctx) => {
  const session = sessions.get(ctx.from.id) ?? {};

  if (!session.qr) {
    await ctx.reply("Please send your QR image first. ♡");
    return;
  }

  if (!session.name) {
    const name = ctx.message.text.trim();

    if (!name) {
      await ctx.reply("Please send a name. ♡");
      return;
    }

    session.name = name.slice(0, 60);
    sessions.set(ctx.from.id, session);

    await ctx.reply("Choose a design ♡", {
      reply_markup: menu()
    });
  }
});

bot.callbackQuery(
  /^design:(coquette|gothic|minimal|pink)$/,
  async (ctx) => {
    await ctx.answerCallbackQuery();

    const design = ctx.match[1];
    const session = sessions.get(ctx.from.id);

    if (!session?.qr || !session?.name) {
      await ctx.reply("Session expired. Send /start and try again. ♡");
      return;
    }

    try {
      const name = escapeXml(session.name);

      const templates = {
        coquette: `
          <svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
            <rect width="1200" height="1500" rx="70" fill="#fff0f7"/>
            <rect x="55" y="55" width="1090" height="1390" rx="55"
              fill="none" stroke="#d98eb4" stroke-width="5"/>
            <text x="600" y="145" text-anchor="middle"
              font-family="Georgia" font-size="64" fill="#7d3f5e">${name}</text>
            <text x="600" y="215" text-anchor="middle"
              font-family="Arial" font-size="28" fill="#9c6681">
              scan to pay ♡
            </text>
            <text x="600" y="1410" text-anchor="middle"
              font-family="Arial" font-size="24" fill="#9c6681">
              custom qr
            </text>
          </svg>`,

        gothic: `
          <svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
            <rect width="1200" height="1500" rx="70" fill="#171419"/>
            <rect x="55" y="55" width="1090" height="1390" rx="55"
              fill="none" stroke="#b9a3b8" stroke-width="4"/>
            <text x="600" y="145" text-anchor="middle"
              font-family="Georgia" font-size="64" fill="#f2e7ef">${name}</text>
            <text x="600" y="215" text-anchor="middle"
              font-family="Arial" font-size="28" fill="#cbbdca">
              SCAN TO PAY
            </text>
            <text x="600" y="1410" text-anchor="middle"
              font-family="Arial" font-size="24" fill="#cbbdca">
              custom qr
            </text>
          </svg>`,

        minimal: `
          <svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
            <rect width="1200" height="1500" rx="70" fill="#ffffff"/>
            <rect x="55" y="55" width="1090" height="1390" rx="55"
              fill="none" stroke="#222" stroke-width="3"/>
            <text x="600" y="145" text-anchor="middle"
              font-family="Arial" font-size="62" fill="#111">${name}</text>
            <text x="600" y="215" text-anchor="middle"
              font-family="Arial" font-size="26" fill="#555">
              SCAN TO PAY
            </text>
            <text x="600" y="1410" text-anchor="middle"
              font-family="Arial" font-size="24" fill="#555">
              custom qr
            </text>
          </svg>`,

        pink: `
          <svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
            <rect width="1200" height="1500" rx="70" fill="#ffe2ee"/>
            <rect x="55" y="55" width="1090" height="1390" rx="55"
              fill="none" stroke="#ff8fba" stroke-width="5"/>
            <text x="600" y="145" text-anchor="middle"
              font-family="Arial" font-weight="bold" font-size="64"
              fill="#b52d68">${name}</text>
            <text x="600" y="215" text-anchor="middle"
              font-family="Arial" font-size="28" fill="#c24c7c">
              scan to pay ♡
            </text>
            <text x="600" y="1410" text-anchor="middle"
              font-family="Arial" font-size="24" fill="#c24c7c">
              custom qr
            </text>
          </svg>`
      };

      const qr = await sharp(session.qr)
        .resize(760, 760, {
          fit: "contain",
          background: {
            r: 255,
            g: 255,
            b: 255,
            alpha: 1
          }
        })
        .png()
        .toBuffer();

      const output = await sharp(Buffer.from(templates[design]))
        .composite([
          {
            input: qr,
            left: 220,
            top: 350
          }
        ])
        .png()
        .toBuffer();

      await ctx.replyWithPhoto(
        new InputFile(output, "custom-qr.png"),
        {
          caption:
            `Done ♡\n\n` +
            `Name: ${session.name}\n` +
            `Design: ${design}\n\n` +
            `Please test-scan the final QR before using it for payments.`
        }
      );

      sessions.delete(ctx.from.id);
    } catch (error) {
      console.error(error);
      await ctx.reply(
        "I couldn't create the design this time. Please send /start and try again. ♡"
      );
    }
  }
);

export const POST = webhookCallback(bot, "std/http");
export const runtime = "nodejs";
