import "dotenv/config";
import { ethers } from "ethers";

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1]
    ? process.argv[idx + 1]
    : undefined;
}

function fail(msg, code = 1) {
  console.error("❌", msg);
  process.exit(code);
}

const rpcUrl = getArg("--rpc") || process.env.RPC_URL;
const privateKey = getArg("--pk") || process.env.PRIVATE_KEY;
const to = getArg("--to");
const amountStr = getArg("--amount");
const tokenAddress = (
  getArg("--token") ||
  process.env.TOKEN_ADDRESS ||
  ""
).trim();

if (!rpcUrl) fail("Не вказано RPC_URL (--rpc або .env RPC_URL)");
if (!privateKey) fail("Не вказано PRIVATE_KEY (--pk або .env PRIVATE_KEY)");
if (!to) fail("Не вказано адресу одержувача (--to)");
if (!amountStr) fail("Не вказано суму переказу (--amount)");

if (!ethers.isAddress(to)) fail(`Некоректна адреса одержувача: ${to}`);

const ERC20_MIN_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

(async () => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const from = await wallet.getAddress();

    console.log("🔗 RPC:", rpcUrl);
    console.log("👤 Відправник:", from);
    console.log("📥 Одержувач:", to);
    console.log("💵 Сума:", amountStr, tokenAddress ? "(ERC-20)" : "(native)");

    let tx;

    if (tokenAddress) {
      if (!ethers.isAddress(tokenAddress)) {
        fail(`Некоректна адреса токена: ${tokenAddress}`);
      }
      const erc20 = new ethers.Contract(tokenAddress, ERC20_MIN_ABI, wallet);
      const [dec, sym] = await Promise.all([
        erc20.decimals(),
        (async () => {
          try {
            return await erc20.symbol();
          } catch {
            return "";
          }
        })(),
      ]);
      const value = ethers.parseUnits(amountStr, dec);
      console.log(
        `🧾 Токен: ${tokenAddress} ${sym ? `(${sym})` : ""}, decimals=${dec}`
      );

      tx = await erc20.transfer(to, value);
      console.log("🚀 Відправлено ERC-20 transfer. TX Hash:", tx.hash);
    } else {
      const value = ethers.parseEther(amountStr);
      tx = await wallet.sendTransaction({ to, value });
      console.log("🚀 Відправлено нативний переказ. TX Hash:", tx.hash);
    }

    const receipt = await tx.wait();
    const statusText = receipt.status === 1 ? "✅ ПІДТВЕРДЖЕНО" : "⚠️ НЕВДАЛО";
    console.log(
      `${statusText}: блок #${receipt.blockNumber}, газ використано ${receipt.gasUsed}`
    );
  } catch (err) {
    const msg =
      (err && (err.info?.error?.message || err.shortMessage || err.message)) ||
      String(err);
    console.error("💥 Помилка:", msg);

    if (/insufficient funds/i.test(msg)) {
      console.error("👉 Перевірте баланс для суми + комісії gas.");
    } else if (/nonce/i.test(msg)) {
      console.error(
        "👉 Спробуйте ще раз або явно встановіть nonce, якщо у вас паралельні транзакції."
      );
    } else if (/replacement|underpriced|fee/i.test(msg)) {
      console.error(
        "👉 Спробуйте збільшити комісію або почекайте меншого навантаження мережі."
      );
    } else if (/invalid address/i.test(msg)) {
      console.error("👉 Перевірте адреси (--to / --token).");
    }

    process.exit(1);
  }
})();
