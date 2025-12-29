from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo
from aiogram.utils import executor

BOT_TOKEN = "8534799945:AAG1O_1k4zfGunZKct5cONYT-kzwGo4-AF8"  # вставьте токен вашего бота
WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzyD3pCgp7y76jSd8NIZWzENajle-KAZAyn8A9TUojQ6_Aq9rmFjNvnf1D6-PK_-I7Eag/exec"  # вставьте URL вашего Apps Script / Mini App

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# Создаём клавиатуру с кнопкой Web App
keyboard = types.InlineKeyboardMarkup()
keyboard.add(
    types.InlineKeyboardButton(
        text="💰 Семейный бюджет",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
)

# Обработчик команды /start
@dp.message_handler(commands=["start"])
async def start(message: types.Message):
    await message.answer("Откройте семейный бюджет:", reply_markup=keyboard)

if __name__ == "__main__":
    executor.start_polling(dp)
