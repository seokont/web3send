🧪 Як запустити локально

Встановіть Node.js v18+

Клон/ініціалізація проєкту

git clone https://github.com/your-username/web3-send-tx.git

# або створіть папку і скопіюйте файли

cd web3-send-tx
npm i
cp .env.example .env

Відредагуйте .env:

RPC_URL=... # ваш RPC провайдер
PRIVATE_KEY=0x... # приватний ключ відправника

# TOKEN_ADDRESS=0x... # якщо хочете відправляти конкретний ERC-20

Запуск:

Нативна монета (ETH/MATIC/BNB тощо):

npm run send -- --to 0xRECEIVER --amount 0.01

ERC-20 токен:

# Варіант 1: через .env (TOKEN_ADDRESS)

npm run send -- --to 0xRECEIVER --amount 25

# Варіант 2: через прапорець --token

npm run send -- --to 0xRECEIVER --amount 25 --token 0xTOKEN

Перевизначення RPC або приватного ключа з CLI (небезпечно, але можливо):

npm run send -- --to 0xRECEIVER --amount 1 --rpc https://... --pk 0xYOUR_PK

Рекомендовано тестувати спочатку на тестнеті (Sepolia/Amoy/BSC Testnet і т.д.), змінюючи RPC_URL.
