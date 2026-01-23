require('dotenv').config();

console.log('=== .env TEST ===');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Mavjud ✅' : 'Yo\'q ❌');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Mavjud ✅' : 'Yo\'q ❌');

if (!process.env.MONGODB_URI) {
  console.log('');
  console.log('❌ MONGODB_URI topilmadi!');
  console.log('📁 .env fayli: C:\Users\User\Desktop\Anonymous-bot\backend\.env');
}
