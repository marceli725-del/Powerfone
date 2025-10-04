import React, { useEffect, useState } from 'react';
import axios from 'axios';
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
function price(n){ return '₦' + n.toLocaleString(); }
function Catalog({ addToCart }){
  const [products, setProducts] = useState([]);
  useEffect(()=>{ axios.get(`${BACKEND}/api/products`).then(r=>setProducts(r.data)).catch(()=>{}); },[]);
  return (
    <div>
      <h2>Catalog</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
        {products.map(p=> (
          <div key={p.sku} style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
            <div style={{ fontWeight:700 }}>{p.brand} — {p.capacity}</div>
            <div style={{ marginTop:8 }}>{price(p.price)}</div>
            <button style={{ marginTop:12 }} onClick={()=>addToCart(p)}>Add to cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Cart({ cart, updateQty, removeItem, proceedToCheckout }){
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  return (
    <div style={{ marginTop:20 }}>
      <h2>Cart</h2>
      {cart.length===0 && <div>Cart is empty</div>}
      {cart.map(item=> (
        <div key={item.sku} style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
          <div style={{ flex:1 }}>{item.brand} {item.capacity}</div>
          <div>{price(item.price)}</div>
          <input type='number' value={item.qty} min={1} onChange={e=>updateQty(item.sku, parseInt(e.target.value||1))} style={{ width:60 }} />
          <button onClick={()=>removeItem(item.sku)}>Remove</button>
        </div>
      ))}
      <div style={{ marginTop:12 }}>Subtotal: <strong>{price(subtotal)}</strong></div>
      <button onClick={proceedToCheckout} style={{ marginTop:8 }} disabled={cart.length===0}>Checkout</button>
    </div>
  );
}
function Checkout({ cart, onComplete }){
  const [customer, setCustomer] = useState({ name:'', email:'', phone:'', address:'' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const placeOrder = async ()=>{
    if(!customer.name||!customer.phone||!customer.address){ alert('Fill name, phone, address'); return; }
    setLoading(true);
    try{
      const res = await axios.post(`${BACKEND}/api/orders`, { customer, cart, paymentMethod, amount: total });
      if(res.data && res.data.trackingId){ onComplete(res.data.trackingId); } else { alert('Order created but no tracking id returned'); }
    }catch(err){ console.error(err); alert('Order creation failed'); }
    setLoading(false);
  };
  return (
    <div style={{ marginTop:20 }}>
      <h2>Checkout</h2>
      <div style={{ display:'grid', gap:8, maxWidth:600 }}>
        <input placeholder='Full name' value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} />
        <input placeholder='Email' value={customer.email} onChange={e=>setCustomer({...customer, email:e.target.value})} />
        <input placeholder='Phone' value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} />
        <input placeholder='Delivery address' value={customer.address} onChange={e=>setCustomer({...customer, address:e.target.value})} />
        <div>
          <label><input type='radio' checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} /> Cash on Delivery</label>
          <label style={{ marginLeft:12 }}><input type='radio' checked={paymentMethod==='flutterwave'} onChange={()=>setPaymentMethod('flutterwave')} /> Pay Online (Flutterwave)</label>
        </div>
        <div>Total: <strong>{price(total)}</strong></div>
        <button onClick={placeOrder} disabled={loading}>{loading? 'Placing...':'Place Order'}</button>
      </div>
    </div>
  );
}
function Tracking(){
  const [tid, setTid] = useState('');
  const [data, setData] = useState(null);
  const lookup = async ()=>{ try{ const res = await axios.get(`${BACKEND}/api/track/${tid}`); setData(res.data); } catch(err){ setData({ error: 'Not found' }); } };
  return (
    <div style={{ marginTop:30 }}>
      <h2>Track Order</h2>
      <input placeholder='Enter tracking id' value={tid} onChange={e=>setTid(e.target.value)} />
      <button onClick={lookup}>Track</button>
      {data && <pre style={{ marginTop:12 }}>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
export default function App(){ const [cart, setCart] = useState([]); const [view, setView] = useState('catalog'); const [lastTracking, setLastTracking] = useState(null);
  const addToCart = (p)=>{ setCart(c=>{ const found = c.find(i=>i.sku===p.sku); if(found) return c.map(i=>i.sku===p.sku? {...i, qty:i.qty+1}:i); return [...c, {...p, qty:1}]; }); };
  const updateQty = (sku, q)=> setCart(c=>c.map(i=>i.sku===sku? {...i, qty:q}:i));
  const removeItem = (sku)=> setCart(c=>c.filter(i=>i.sku!==sku));
  const proceedToCheckout = ()=> setView('checkout');
  const onComplete = (trackingId)=>{ setLastTracking(trackingId); setCart([]); setView('catalog'); alert('Order placed! Tracking ID: '+trackingId); }
  return (
    <div style={{ padding:20, fontFamily:'Arial' }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1>PowerFone ⚡</h1>
        <div>
          <button onClick={()=>setView('catalog')}>Catalog</button>
          <button onClick={()=>setView('cart')} style={{ marginLeft:8 }}>Cart ({cart.length})</button>
          <button onClick={()=>setView('track')} style={{ marginLeft:8 }}>Track</button>
        </div>
      </header>
      <main>
        {view==='catalog' && <Catalog addToCart={addToCart} />}
        {view==='cart' && <Cart cart={cart} updateQty={updateQty} removeItem={removeItem} proceedToCheckout={proceedToCheckout} />}
        {view==='checkout' && <Checkout cart={cart} onComplete={onComplete} />}
        {view==='track' && <Tracking />}
      </main>
      <footer style={{ marginTop:40, borderTop:'1px solid #eee', paddingTop:12 }}>© {new Date().getFullYear()} PowerFone</footer>
    </div>
  ); }
