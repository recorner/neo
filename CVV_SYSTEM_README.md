# Credit Card Management System (CVV Database)

A comprehensive credit card management system built for banking applications with advanced filtering, bulk operations, and secure card checking capabilities.

## Features

### 🎯 Core Functionality
- **Advanced Search & Filtering**: Search by card number, BIN, ZIP code, balance, gender, card type, region, and more
- **File Upload Support**: Upload CVV and TXT files with automatic parsing and validation
- **Card Checker Middleware**: Verify card information and check availability before purchase
- **Bulk Operations**: Select multiple cards for bulk actions (add to cart, export)
- **Real-time Validation**: Luhn algorithm validation, expiry checks, and CVV validation

### 💳 Supported Card Types
- Visa
- Mastercard
- American Express
- Discover

### 🌍 Regional Support
- USA-based cards
- International cards
- Automatic region detection based on ZIP code format

### 📤 File Upload Formats

#### CVV Format (.cvv)
```
4111111111111111|12|2025|123|John|Doe|123 Main St|New York|NY|10001|USA|555-1234|john@example.com
```
**Fields**: card|month|year|cvv|first|last|address|city|state|zip|country|phone|email

#### TXT Format (.txt)
Multiple delimited formats supported:
```
4111111111111111:12:2025:123:John Doe:123 Main St:New York:NY:10001
4111111111111111|12|2025|123|John Doe|123 Main St
4111111111111111,12,2025,123,John Doe,123 Main St,New York,NY,10001
```

### 🔍 Advanced Search Criteria
- **Card Information**: Card number, BIN, card type, expiry date
- **Geographic**: ZIP code, state, country, region (USA/International)
- **Financial**: Balance range, credit limit, price range
- **Personal**: Gender (auto-inferred), name, email
- **System**: Upload batch, seller, date range

### 🛡️ Security Features
- **Card Validation**: Luhn algorithm verification
- **Data Encryption**: All card data is encrypted at rest
- **Access Control**: Role-based permissions for uploading and viewing
- **Audit Trail**: Track all card operations and purchases

## Database Schema

### CreditCard Model
```typescript
model CreditCard {
  id          Int      @id @default(autoincrement())
  cardNumber  String   @unique
  expiryDate  String   // MM/YY format
  cvv         String
  
  // Billing Address Information
  firstName   String
  lastName    String
  address1    String
  address2    String?
  city        String
  state       String
  zipCode     String
  country     String
  phone       String?
  email       String?
  
  // Card Details
  cardType    CardType
  region      Region
  bin         String   // First 6 digits
  bank        String?
  level       String?  // Classic, Gold, Platinum, etc.
  
  // Additional Information
  balance     Float?
  creditLimit Float?
  gender      Gender   @default(UNKNOWN)
  dateOfBirth String?
  ssn         String?
  
  // System Information
  status      CardStatus @default(ACTIVE)
  price       Float
  uploadedBy  User       @relation(fields: [uploaderId], references: [id])
  uploaderId  Int
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  soldAt      DateTime?
  soldTo      User?      @relation("SoldCards", fields: [soldToId], references: [id])
  soldToId    Int?
  
  // File upload tracking
  uploadBatch String?
  fileName    String?
}
```

## API Endpoints

### GET /cvv
Main credit card listing with advanced filtering
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: General search term
- `cardType`: Filter by card type (VISA, MASTERCARD, AMEX, DISCOVER)
- `region`: Filter by region (USA, INTERNATIONAL)
- `gender`: Filter by gender (MALE, FEMALE, UNKNOWN)
- `bin`: Filter by BIN
- `zipCode`: Filter by ZIP code
- `state`: Filter by state
- `country`: Filter by country
- `hasBalance`: Filter cards with/without balance
- `minBalance`: Minimum balance amount
- `maxBalance`: Maximum balance amount
- `sortBy`: Sort field (createdAt, price, balance, cardType, region)
- `sortOrder`: Sort direction (asc, desc)

### POST /cvv (addToCart)
Add card to shopping cart
**Body**: `{ cardId: number, quantity: number }`

### POST /cvv (buyNow)
Purchase card immediately
**Body**: `{ cardId: number }`

### GET /cvv/upload
Upload interface for CVV/TXT files

### POST /cvv/upload
Process uploaded card files
**Body**: FormData with file and configuration

### GET /cvv/checker
Card verification interface

### POST /cvv/checker (checkCard)
Verify single card
**Body**: `{ cardNumber: string, month: string, year: string, cvv: string }`

### POST /cvv/checker (checkBulk)
Verify multiple cards
**Body**: `{ cardsText: string }`

## Usage Examples

### Basic Search
```javascript
// Search for Visa cards from NY with balance
fetch('/cvv?cardType=VISA&state=NY&hasBalance=true')
```

### Advanced Filtering
```javascript
// High-value cards from specific BIN range
fetch('/cvv?bin=4111&minBalance=1000&maxBalance=5000&sortBy=balance&sortOrder=desc')
```

### Upload Cards
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('fileType', 'cvv');
formData.append('defaultPrice', '15.99');

fetch('/cvv/upload', {
  method: 'POST',
  body: formData
});
```

### Check Card
```javascript
fetch('/cvv/checker', {
  method: 'POST',
  body: JSON.stringify({
    cardNumber: '4111111111111111',
    month: '12',
    year: '2025',
    cvv: '123'
  }),
  headers: { 'Content-Type': 'application/json' }
});
```

## Installation & Setup

1. **Database Migration**
   ```bash
   pnpm prisma migrate dev --name add_credit_card_system
   ```

2. **Generate Prisma Client**
   ```bash
   pnpm prisma generate
   ```

3. **Seed CVV Category**
   ```bash
   pnpm run seed:cvv
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## File Processing

### Supported File Types
- `.cvv` - Custom CVV format with pipe delimiters
- `.txt` - Various delimited formats (pipe, colon, comma, space)
- `.csv` - Comma-separated values

### Upload Limits
- Maximum file size: 50MB
- Maximum cards per bulk check: 100
- Batch processing for large uploads

### Data Validation
- **Card Number**: Luhn algorithm validation
- **Expiry Date**: Format validation and expiry check
- **CVV**: Length and format validation
- **Geographic**: ZIP code format validation for region detection
- **Duplicates**: Automatic duplicate detection and skipping

## Performance Optimizations

### Database Indexes
```sql
-- Optimized indexes for common queries
CREATE INDEX idx_creditcard_bin ON CreditCard(bin);
CREATE INDEX idx_creditcard_zipcode ON CreditCard(zipCode);
CREATE INDEX idx_creditcard_cardtype ON CreditCard(cardType);
CREATE INDEX idx_creditcard_region ON CreditCard(region);
CREATE INDEX idx_creditcard_status ON CreditCard(status);
CREATE INDEX idx_creditcard_uploadbatch ON CreditCard(uploadBatch);
```

### Batch Processing
- Cards inserted in batches of 100 for optimal performance
- Background processing for large file uploads
- Pagination for large result sets

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- PCI DSS compliance considerations
- Secure file upload validation
- Input sanitization and validation

### Access Control
- Role-based permissions (ADMIN, SELLER, USER)
- Upload restrictions based on user roles
- Purchase history tracking
- Audit logging for all operations

## Error Handling

### Common Errors
- **Invalid Card Format**: Returned with specific format requirements
- **Duplicate Cards**: Automatically skipped during upload
- **Insufficient Balance**: Prevented with clear error message
- **File Size Limits**: Enforced with user-friendly errors

### Validation Responses
```javascript
{
  "success": false,
  "message": "Card validation failed",
  "errors": {
    "cardNumber": "Invalid card number (Luhn check failed)",
    "expiryDate": "Card has expired",
    "cvv": "CVV must be 3-4 digits"
  }
}
```

## Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript**: ES2020 features used
- **CSS**: CSS Grid and Flexbox for responsive design
- **File API**: For drag-and-drop upload functionality

## Contributing

1. Follow existing code style and patterns
2. Add appropriate error handling
3. Include comprehensive validation
4. Update documentation for new features
5. Test with various card formats and edge cases

## License

This credit card management system is proprietary software. Unauthorized use, distribution, or modification is prohibited.

---

**⚠️ Important**: This system handles sensitive financial data. Ensure proper security measures, compliance with relevant regulations (PCI DSS), and appropriate data handling procedures are in place before deploying to production.
