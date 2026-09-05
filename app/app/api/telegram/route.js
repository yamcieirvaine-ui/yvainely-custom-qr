import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import sharp from "sharp";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is missing");

const bot = new Bot(token);
const sessions = globalThis.__qrSessions ?? (globalThis.__qrSessions = new Map());

function menu() {
  return new InlineKeyboard()
    .text("🎀 Coquette", "design:coquette")
    .text("🖤 Gothic", "design:gothic").row()
    .text("🤍 Minimal", "design:minimal")
    .text("🌸 Pink", "design:pink");
}

bot.command("start", async (ctx) => {
  sessions.set(ctx.from.id, {});
  await ctx.reply(
    "♡ CUSTOM QR BOT ♡\n\nSend your bank / QRPh QR image.\n\nYour QR pattern will be kept intact; the bot only adds a design around it."
  );
});

bot.on("message:photo", async (ctx) => {
  const photo = ctx.message.photo.at(-1);
  const file = await ctx.api.getFile(photo.file_id);
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const s = sessions.get(ctx.from.id) ?? {};
  s.qr = buf;
  sessions.set(ctx.from.id, s);

  await ctx.reply(
    "QR received ♡\n\nNow send the name you want to appear on the design."
  );
});

bot.on("message:text", async (ctx) => {
  const s = sessions.get(ctx.from.id) ?? {};

  if (!s.qr) {
    await ctx.reply("Please send your QR image first. ♡");
    return;
  }

  if (!s.name) {
    s.name = ctx.message.text.trim().slice(0, 60);
    sessions.set(ctx.from.id, s);

    await ctx.reply("Choose a design:", {
      reply_markup: menu()
    });
  }
});

bot.callbackQuery(/^design:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const design = ctx.match[1];
  const s = sessions.get(ctx.from.id);

  if (!s?.qr || !s?.name) {
    return ctx.reply("Session expired. Send /start and try again.");
  }

  const svg = {
    coquette: `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1500" rx="70" fill="#fff0f7"/>
      <rect x="55" y="55" width="1090" height="1390" rx="55"
        fill="none" stroke="#d98eb4" stroke-width="5"/>
      <text x="600" y="150" text-anchor="middle"
        font-family="Georgia" font-size="64" fill="#7d3f5e">
        ${escapeXml(s.name)}
      </text>
      <text x="600" y="220" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#9c6681">
        scan to pay ♡
      </text>
      <text x="600" y="1410" text-anchor="middle"
        font-family="Arial" font-size="24" fill="#9c6681">
        custom qr
      </text>
    </svg>`,

    gothic: `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1500" rx="70" fill="#171419"/>
      <rect x="55" y="55" width="1090" height="1390" rx="55"
        fill="none" stroke="#b9a3b8" stroke-width="4"/>
      <text x="600" y="150" text-anchor="middle"
        font-family="Georgia" font-size="64" fill="#f2e7ef">
        ${escapeXml(s.name)}
      </text>
      <text x="600" y="220" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#cbbdca">
        SCAN TO PAY
      </text>
      <text x="600" y="1410" text-anchor="middle"
        font-family="Arial" font-size="24" fill="#cbbdca">
        custom qr
      </text>
    </svg>`,

    minimal: `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1500" rx="70" fill="#ffffff"/>
      <rect x="55" y="55" width="1090" height="1390" rx="55"
        fill="none" stroke="#222" stroke-width="3"/>
      <text x="600" y="150" text-anchor="middle"
        font-family="Arial" font-size="62" fill="#111">
        ${escapeXml(s.name)}
      </text>
      <text x="600" y="220" text-anchor="middle"
        font-family="Arial" font-size="26" fill="#555">
        SCAN TO PAY
      </text>
      <text x="600" y="1410" text-anchor="middle"
        font-family="Arial" font-size="24" fill="#555">
        custom qr
      </text>
    </svg>`,

    pink: `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1500" rx="70" fill="#ffe2ee"/>
      <rect x="55" y="55" width="1090" height="1390" rx="55"
        fill="none" stroke="#ff8fba" stroke-width="5"/>
      <text x="600" y="150" text-anchor="middle"
        font-family="Arial" font-weight="bold" font-size="64"
        fill="#b52d68">
        ${escapeXml(s.name)}
      </text>
      <text x="600" y="220" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#c24c7c">
        scan to pay ♡
      </text>
      <text x="600" y="1410" text-anchor="middle"
        font-family="Arial" font-size="24" fill="#c24c7c">
        custom qr
      </text>
    </svg>`
  }[design];

  const qr = await sharp(s.qr)
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

  const out = await sharp(Buffer.from(svg))
    .composite([
      {
        input: qr,
        left: 220,
        top: 350
      }
    ])
    .png()
    .toBuffer();

  await ctx.replyWithPhoto(new Blob([out]), {
    caption:
      `Done ♡\n\nName: ${s.name}\nDesign: ${design}\n\n` +
      `Tip: test-scan the final QR before using it for payments.`
  });

  sessions.delete(ctx.from.id);
});

function escapeXml(v) {
  return v.replace(
    /[<>&'"]/g,
    c =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;"
      }[c])
  );
}

export const POST = webhookCallback(bot, "std/http");
export const runtime = "nodejs";
