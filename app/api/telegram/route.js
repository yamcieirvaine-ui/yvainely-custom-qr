import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import sharp from "sharp";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is missing");
}

const bot = new Bot(token);

const sessions =
  globalThis.__qrSessions ??
  (globalThis.__qrSessions = new Map());

function menu() {
  return new InlineKeyboard()
    .text("🎀 Coquette", "design:coquette")
    .text("🖤 Gothic", "design:gothic")
    .row()
    .text("🤍 Minimal", "design:minimal")
    .text("🌸 Pink", "design:pink");
}

bot.command("start", async (ctx) => {
  sessions.set(ctx.from.id, {});

  await ctx.reply(
    "♡ CUSTOM QR BOT ♡\n\n" +
    "Send your bank / QRPh QR image.\n\n" +
    "Your QR pattern will be kept intact; " +
    "the bot only adds a design around it."
  );
});

bot.on("message:photo", async (ctx) => {
  const photo = ctx.message.photo.at(-1);

  const file = await ctx.api.getFile(photo.file_id);

  const url =
    `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const session = sessions.get(ctx.from.id) ?? {};

  session.qr = buf;

  sessions.set(ctx.from.id, session);

  await ctx.reply(
    "QR received ♡\n\n" +
    "Now send the name you want to appear on the design."
  );
});

bot.on("message:text", async (ctx) => {
  const session = sessions.get(ctx.from.id) ?? {};

  if (!session.qr) {
    await ctx.reply("Please send your QR image first. ♡");
    return;
  }

  if (!session.name) {
    session.name = ctx.message.text
      .trim()
      .slice(0, 60);

    sessions.set(ctx.from.id, session);

    await ctx.reply("Choose a design:", {
      reply_markup: menu()
    });
  }
});

bot.callbackQuery(/^design:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const design = ctx.match[1];

  const session = sessions.get(ctx.from.id);

  if (!session?.qr || !session?.name) {
    await ctx.reply(
      "Session expired. Send /start and try again."
    );
    return;
  }

  const svg = {
    coquette: `
      <svg width="1200" height="1500"
        xmlns="http://www.w3.org/2000/svg">

        <rect width="1200" height="1500"
          rx="70" fill="#fff0f7"/>

        <rect x="55" y="55"
          width="1090" height="1390"
          rx="55"
          fill="none"
          stroke="#d98eb4"
          stroke-width="5"/>

        <text x="600" y="150"
          text-anchor="middle"
          font-family="Georgia"
          font-size="64"
          fill="#7d3f5e">
          ${escapeXml(session.name)}
        </text>

        <text x="600" y="220"
          text-anchor
