const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
const DB_URL = process.env.DB_URL;
if (!DB_URL) { console.error('DB_URL not set. Copy .env.example -> .env and set DB_URL'); process.exit(1); }
const sequelize = new Sequelize(DB_URL, { dialect: 'postgres', logging: false });
const Product = sequelize.define('Product', { sku: { type: DataTypes.STRING, unique: true }, brand: DataTypes.STRING, capacity: DataTypes.STRING, price: DataTypes.INTEGER });
const Order = sequelize.define('Order', { trackingId: { type: DataTypes.STRING, unique: true }, customerName: DataTypes.STRING, customerEmail: DataTypes.STRING, phone: DataTypes.STRING, address: DataTypes.TEXT, items: DataTypes.JSON, amount: DataTypes.INTEGER, paymentMethod: DataTypes.STRING, paymentStatus: DataTypes.STRING, status: DataTypes.STRING });
async function seedProducts(){
  const count = await Product.count();
  if (count > 0) { console.log('Products exist, skipping seed'); return; }
  const products = [
    { sku: 'oraimo-10k', brand: 'Oraimo', capacity: '10,000mAh', price: 12500 },
    { sku: 'oraimo-15k', brand: 'Oraimo', capacity: '15,000mAh', price: 15500 },
    { sku: 'oraimo-20k', brand: 'Oraimo', capacity: '20,000mAh', price: 19000 },
    { sku: 'oraimo-27k', brand: 'Oraimo', capacity: '27,000mAh', price: 24500 },
    { sku: 'oraimo-30k', brand: 'Oraimo', capacity: '30,000mAh', price: 28000 },
    { sku: 'oraimo-40k', brand: 'Oraimo', capacity: '40,000mAh', price: 33000 },
    { sku: 'oraimo-50k', brand: 'Oraimo', capacity: '50,000mAh', price: 39000 },
    { sku: 'newage-20k', brand: 'New Age', capacity: '20,000mAh', price: 18000 },
    { sku: 'newage-22_5k', brand: 'New Age', capacity: '22,500mAh', price: 20000 },
    { sku: 'newage-33k', brand: 'New Age', capacity: '33,000mAh', price: 25000 },
    { sku: 'newage-44k', brand: 'New Age', capacity: '44,000mAh', price: 31500 },
    { sku: 'newage-50k', brand: 'New Age', capacity: '50,000mAh', price: 37000 },
    { sku: 'newage-55k', brand: 'New Age', capacity: '55,000mAh', price: 42000 },
    { sku: 'newage-66k', brand: 'New Age', capacity: '66,000mAh', price: 49500 }
  ];
  await Product.bulkCreate(products);
  console.log('Seeded products:', products.length);
}
async function start(){ try{ await sequelize.authenticate(); await sequelize.sync(); console.log('DB connected'); await seedProducts(); }catch(err){ console.error('DB error', err); process.exit(1); }
  app.get('/', (req,res)=> res.json({ message: 'PowerFone API running' }));
  app.get('/api/products', async (req,res)=>{ const products = await Product.findAll({ order: [['brand','ASC'], ['price','ASC']] }); res.json(products); });
  app.post('/api/orders', async (req,res)=>{ try{ const { customer, cart, paymentMethod, amount } = req.body; if(!customer || !cart || !amount) return res.status(400).json({ error: 'Missing fields' }); const trackingId = 'PF' + Date.now(); const order = await Order.create({ trackingId, customerName: customer.name, customerEmail: customer.email, phone: customer.phone, address: customer.address, items: cart, amount, paymentMethod, paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'INITIATED', status: paymentMethod === 'cod' ? 'Pending Payment' : 'Processing' }); res.json({ success: true, trackingId }); }catch(err){ console.error('order error', err); res.status(500).json({ success: false, error: 'Order creation failed' }); } });
  app.get('/api/track/:trackingId', async (req,res)=>{ const order = await Order.findOne({ where: { trackingId: req.params.trackingId } }); if(!order) return res.status(404).json({ error: 'Order not found' }); res.json({ trackingId: order.trackingId, status: order.status, amount: order.amount, items: order.items, updatedAt: order.updatedAt }); });
  app.post('/api/verify-payment', async (req,res)=>{ const { txRef, orderId } = req.body; console.log('verify-payment called', txRef, orderId); if(!orderId) return res.status(400).json({ error: 'Missing orderId' }); const order = await Order.findOne({ where: { trackingId: orderId } }); if(!order) return res.status(404).json({ error: 'Order not found' }); order.paymentStatus = 'PAID'; order.status = 'Processing'; await order.save(); res.json({ ok: true }); });
  const PORT = process.env.PORT || 5000; app.listen(PORT, ()=> console.log(`PowerFone backend listening on ${PORT}`)); }
start();
