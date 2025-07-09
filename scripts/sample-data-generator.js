// Sample CVV data generator for testing purposes
// This generates fake but realistic-looking test data

const cardTypes = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
const regions = ['USA', 'INTERNATIONAL'];
const genders = ['MALE', 'FEMALE', 'UNKNOWN'];
const states = ['NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia'];

const maleNames = ['John', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher'];
const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const streets = ['Main St', 'Oak Ave', 'Elm St', 'Park Ave', 'First St', 'Second St', 'Third St', 'Fourth St', 'Fifth St', 'Broadway'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];

function generateCardNumber(type) {
    let prefix;
    let length;
    
    switch (type) {
        case 'VISA':
            prefix = '4';
            length = 16;
            break;
        case 'MASTERCARD':
            prefix = '5' + Math.floor(Math.random() * 5 + 1);
            length = 16;
            break;
        case 'AMEX':
            prefix = '3' + (Math.random() < 0.5 ? '4' : '7');
            length = 15;
            break;
        case 'DISCOVER':
            prefix = '6011';
            length = 16;
            break;
        default:
            prefix = '4';
            length = 16;
    }
    
    let cardNumber = prefix;
    while (cardNumber.length < length - 1) {
        cardNumber += Math.floor(Math.random() * 10);
    }
    
    // Calculate Luhn check digit
    let sum = 0;
    let alternate = true;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i));
        
        if (alternate) {
            digit *= 2;
            if (digit > 9) {
                digit = (digit % 10) + 1;
            }
        }
        
        sum += digit;
        alternate = !alternate;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return cardNumber + checkDigit;
}

function generateExpiryDate() {
    const currentYear = new Date().getFullYear();
    const year = currentYear + Math.floor(Math.random() * 8); // 0-7 years from now
    const month = Math.floor(Math.random() * 12) + 1;
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
}

function generateCVV(cardType) {
    const length = cardType === 'AMEX' ? 4 : 3;
    let cvv = '';
    for (let i = 0; i < length; i++) {
        cvv += Math.floor(Math.random() * 10);
    }
    return cvv;
}

function generateZip(region) {
    if (region === 'USA') {
        return Math.floor(Math.random() * 90000 + 10000).toString();
    } else {
        // International postal codes (simplified)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        return letters[Math.floor(Math.random() * letters.length)] +
               numbers[Math.floor(Math.random() * numbers.length)] +
               letters[Math.floor(Math.random() * letters.length)] + ' ' +
               numbers[Math.floor(Math.random() * numbers.length)] +
               letters[Math.floor(Math.random() * letters.length)] +
               numbers[Math.floor(Math.random() * numbers.length)];
    }
}

function generateBalance() {
    // 70% chance of no balance, 30% chance of having balance
    if (Math.random() < 0.7) return null;
    
    // Generate realistic balance amounts
    const balanceRanges = [
        { min: 50, max: 500, weight: 0.4 },
        { min: 500, max: 2000, weight: 0.3 },
        { min: 2000, max: 5000, weight: 0.2 },
        { min: 5000, max: 15000, weight: 0.1 }
    ];
    
    let random = Math.random();
    for (const range of balanceRanges) {
        if (random < range.weight) {
            return Math.floor(Math.random() * (range.max - range.min) + range.min);
        }
        random -= range.weight;
    }
    
    return Math.floor(Math.random() * 500 + 50); // fallback
}

function generateSampleCard() {
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    
    let firstName, lastName;
    if (gender === 'MALE') {
        firstName = maleNames[Math.floor(Math.random() * maleNames.length)];
    } else if (gender === 'FEMALE') {
        firstName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    } else {
        firstName = [...maleNames, ...femaleNames][Math.floor(Math.random() * (maleNames.length + femaleNames.length))];
    }
    
    lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const cardNumber = generateCardNumber(cardType);
    const expiryDate = generateExpiryDate();
    const cvv = generateCVV(cardType);
    const zipCode = generateZip(region);
    const balance = generateBalance();
    const price = Math.floor(Math.random() * 50 + 5); // $5-$55
    
    const address1 = `${Math.floor(Math.random() * 9999 + 1)} ${streets[Math.floor(Math.random() * streets.length)]}`;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = region === 'USA' ? states[Math.floor(Math.random() * states.length)] : '';
    const country = region === 'USA' ? 'USA' : countries[Math.floor(Math.random() * countries.length)];
    
    const email = Math.random() < 0.8 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : '';
    const phone = Math.random() < 0.6 ? `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}` : '';
    
    return {
        cardNumber,
        expiryDate,
        cvv,
        firstName,
        lastName,
        address1,
        address2: '',
        city,
        state,
        zipCode,
        country,
        phone,
        email,
        cardType,
        region,
        bin: cardNumber.substring(0, 6),
        bank: 'Test Bank',
        level: ['Classic', 'Gold', 'Platinum'][Math.floor(Math.random() * 3)],
        balance,
        creditLimit: Math.floor(Math.random() * 10000 + 1000),
        gender,
        dateOfBirth: '',
        ssn: '',
        price
    };
}

// Generate CVV format
function generateCVVFormat(count = 100) {
    const cards = [];
    for (let i = 0; i < count; i++) {
        const card = generateSampleCard();
        const cvvLine = [
            card.cardNumber,
            card.expiryDate.split('/')[0], // month
            '20' + card.expiryDate.split('/')[1], // full year
            card.cvv,
            card.firstName,
            card.lastName,
            card.address1,
            card.city,
            card.state,
            card.zipCode,
            card.country,
            card.phone,
            card.email
        ].join('|');
        cards.push(cvvLine);
    }
    return cards.join('\n');
}

// Generate TXT format
function generateTXTFormat(count = 100) {
    const cards = [];
    for (let i = 0; i < count; i++) {
        const card = generateSampleCard();
        const txtLine = [
            card.cardNumber,
            card.expiryDate.split('/')[0], // month
            '20' + card.expiryDate.split('/')[1], // full year
            card.cvv,
            `${card.firstName} ${card.lastName}`,
            card.address1,
            card.city,
            card.state,
            card.zipCode
        ].join(':');
        cards.push(txtLine);
    }
    return cards.join('\n');
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.generateSampleData = {
        generateCVVFormat,
        generateTXTFormat,
        generateSampleCard
    };
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateCVVFormat,
        generateTXTFormat,
        generateSampleCard
    };
}

// Example usage:
console.log('Sample CVV Format (10 cards):');
console.log(generateCVVFormat(10));
console.log('\n' + '='.repeat(50) + '\n');
console.log('Sample TXT Format (10 cards):');
console.log(generateTXTFormat(10));
