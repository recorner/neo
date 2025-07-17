# 🚀 NeoShop In-App Crypto Payment System

## Overview

This implementation provides a complete in-app cryptocurrency payment flow using NowPayments, eliminating external redirects and providing a seamless user experience.

## ✅ Features Implemented

### 1. **In-App Payment Experience**
- Modal-based payment interface directly on untouch.live
- Coin selection (BTC, ETH, USDT, USDC, LTC, BCH, XRP, ADA, MATIC, TRX)
- QR code generation for mobile wallet scanning
- Real-time payment status updates (every 5 seconds)
- Auto-updating balance on confirmation

### 2. **NowPayments Integration**
- Uses `/v1/payment` endpoint for direct payment creation
- Automatic IPN (Instant Payment Notification) handling
- HMAC-SHA512 signature validation for security
- Support for 160+ cryptocurrencies
- Proper error handling and logging

### 3. **Security Features**
- ✅ Rate limiting (10 requests per minute per IP)
- ✅ Origin validation (same-origin requests only)
- ✅ HMAC signature verification on IPN callbacks
- ✅ HTTPS-only with valid SSL certificates
- ✅ Input validation and sanitization
- ✅ Comprehensive logging for audit trails

### 4. **API Endpoints**

#### Payment Creation
```
GET  /api/payment         # Get available currencies
POST /api/payment         # Create new payment
```

#### Payment Status
```
GET  /api/payment/status?id={payment_id}  # Check payment status
```

#### IPN Callback
```
POST /api/payment/ipn     # Secure webhook for NowPayments
```

### 5. **Future-Proofed for Telegram Integration**
- Event emitter system for real-time notifications
- Telegram bot framework ready for deployment
- WebSocket/Redis pub-sub architecture prepared

## 🔧 Configuration

### Environment Variables
```env
# NowPayments Configuration
NOWPAYMENTS_API_KEY=prod_xxx_generated_key
NOWPAYMENTS_IPN_SECRET=your_secure_ipn_secret
PAYMENT_CALLBACK_URL=https://untouch.live/api/payment/ipn

# Optional: Telegram Bot (Future Integration)
TELEGRAM_BOT_TOKEN=your_bot_token
```

### Database Schema
The system uses existing `TopUp` table with no schema changes required:
```sql
model TopUp {
  id        Int     @id @default(autoincrement())
  amount    Float
  reference String  @unique  # Stores NowPayments payment_id
  completed Boolean @default(false)
  user      User    @relation(fields: [userId], references: [id])
  userId    Int
  createdAt DateTime @default(now())
}
```

## 🎯 Usage

### 1. **Balance Page Integration**
Users can now choose between:
- **🚀 Pay with Crypto (In-App)** - New seamless experience
- **💳 Legacy Payment (Redirect)** - Original external flow

### 2. **Payment Flow**
1. User selects amount and cryptocurrency
2. System creates payment via NowPayments API
3. QR code and address displayed immediately
4. Real-time status monitoring begins
5. Balance updates automatically on confirmation

### 3. **Standalone Payment Page**
Access via: `/pay/{orderId}` for dedicated payment interface

## 🔒 Security Measures

### Rate Limiting
- 10 payment requests per minute per IP address
- Configurable window and limits
- Memory-based tracking (can be upgraded to Redis)

### Origin Validation
- Only allows requests from approved domains
- Validates both `Origin` and `Referer` headers
- Supports development and production environments

### HMAC Validation
- All IPN callbacks verified with HMAC-SHA512
- Uses sorted JSON keys for consistent hashing
- Rejects any requests with invalid signatures

### Logging & Monitoring
- All payment events logged with timestamps
- IP tracking for security analysis
- Error logging for debugging
- Event system for real-time monitoring

## 🤖 Telegram Integration (Ready)

The system includes a complete Telegram bot framework:

```typescript
// Payment notifications
paymentEvents.subscribe('payment_confirmed', (event) => {
  telegramBot.sendMessage(
    event.userId, 
    `💰 Payment confirmed: $${event.amount}`
  );
});
```

### Setup Telegram Bot:
1. Create bot via @BotFather
2. Set `TELEGRAM_BOT_TOKEN` in environment
3. Configure webhook endpoint
4. Users link accounts via web interface

## 📊 Monitoring & Analytics

### Payment Events
The system emits events for:
- `payment_created` - New payment initiated
- `payment_confirmed` - Payment successfully processed
- `payment_failed` - Payment failed/expired/refunded

### Metrics Available
- Payment volume and success rates
- Popular cryptocurrency choices
- Average payment amounts
- Geographic distribution (via IP tracking)

## 🚀 Deployment Notes

### Production Checklist
- ✅ SSL certificates installed and valid
- ✅ Environment variables configured
- ✅ IPN endpoint accessible from NowPayments
- ✅ Rate limiting configured appropriately
- ✅ Logging system configured
- ✅ Database backups enabled

### Testing
```bash
# Test currency fetching
curl https://untouch.live/api/payment

# Test payment creation (requires authentication)
curl -X POST https://untouch.live/api/payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "currency": "btc"}'
```

## 📈 Performance Optimizations

- In-memory rate limiting (upgradeable to Redis)
- Efficient database queries with proper indexing
- QR code generation optimized for speed
- Minimal API calls to NowPayments
- Caching of currency lists

## 🔮 Future Enhancements

1. **WebSocket Integration** - Real-time updates without polling
2. **Redis Pub/Sub** - Distributed event system
3. **Advanced Analytics** - Payment behavior analysis
4. **Multi-language Support** - Internationalization
5. **Mobile App Integration** - Deep linking support

## 🆘 Support & Troubleshooting

### Common Issues

**Payment not updating:**
- Check IPN endpoint accessibility
- Verify HMAC secret configuration
- Check server logs for errors

**Rate limiting triggered:**
- Implement user feedback for limits
- Consider IP whitelisting for legitimate traffic
- Monitor for abuse patterns

**Telegram notifications not working:**
- Verify bot token configuration
- Check webhook setup
- Ensure user account linking

### Logging Locations
- Payment creation: `/api/payment` endpoint logs
- IPN processing: `/api/payment/ipn` endpoint logs
- Security events: Rate limiting and origin validation logs
- Telegram events: Bot interaction logs

---

**🎉 Implementation Complete!** The system is production-ready with enterprise-grade security and scalability features.
