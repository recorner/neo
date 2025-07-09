import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting CVV database seeding...');

  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        balance: 1000.0,
        role: ['ADMIN'],
        md2faCodes: []
      }
    });

    // Create seller user
    const seller = await prisma.user.upsert({
      where: { username: 'seller' },
      update: {},
      create: {
        username: 'seller',
        password: hashedPassword,
        balance: 500.0,
        role: ['SELLER'],
        md2faCodes: []
      }
    });

    // Create buyer user
    const buyer = await prisma.user.upsert({
      where: { username: 'buyer' },
      update: {},
      create: {
        username: 'buyer',
        password: hashedPassword,
        balance: 100.0,
        role: ['BUYER'],
        md2faCodes: []
      }
    });

    console.log('Created users:', { admin: admin.id, seller: seller.id, buyer: buyer.id });

    // Sample credit card data
    const sampleCards = [
      {
        cardNumber: '4111111111111111',
        expMonth: '12',
        expYear: '2026',
        cvv: '123',
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        phone: '5551234567',
        email: 'john@example.com',
        price: 2.50,
        isDiscounted: false,
        sellerId: seller.id
      },
      {
        cardNumber: '5555555555554444',
        expMonth: '11',
        expYear: '2025',
        cvv: '456',
        fullName: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
        country: 'US',
        phone: '5559876543',
        email: 'jane@example.com',
        price: 3.00,
        isDiscounted: true,
        sellerId: seller.id
      },
      {
        cardNumber: '378282246310005',
        expMonth: '10',
        expYear: '2027',
        cvv: '789',
        fullName: 'Bob Johnson',
        firstName: 'Bob',
        lastName: 'Johnson',
        address: '789 Pine St',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        country: 'US',
        phone: '5555551234',
        email: 'bob@example.com',
        price: 4.00,
        isDiscounted: false,
        sellerId: seller.id
      },
      {
        cardNumber: '6011111111111117',
        expMonth: '09',
        expYear: '2026',
        cvv: '321',
        fullName: 'Alice Brown',
        firstName: 'Alice',
        lastName: 'Brown',
        address: '321 Elm St',
        city: 'Toronto',
        state: 'ON',
        zip: 'M5V3A8',
        country: 'CA',
        phone: '4161234567',
        email: 'alice@example.com',
        price: 1.50,
        isDiscounted: true,
        sellerId: seller.id
      },
      {
        cardNumber: '4000000000000002',
        expMonth: '08',
        expYear: '2025',
        cvv: '654',
        fullName: 'Charlie Wilson',
        firstName: 'Charlie',
        lastName: 'Wilson',
        address: '654 Maple Ave',
        city: 'London',
        state: 'ENG',
        zip: 'SW1A1AA',
        country: 'UK',
        phone: '442071234567',
        email: 'charlie@example.com',
        price: 5.00,
        isDiscounted: false,
        sellerId: seller.id
      }
    ];

    // Create sample credit cards
    const createdCards = [];
    for (const cardData of sampleCards) {
      const card = await prisma.creditCard.create({
        data: cardData
      });
      createdCards.push(card);
    }

    console.log(`Created ${createdCards.length} sample credit cards`);

    // Create some sample card checks
    const sampleChecks = [
      {
        cardId: createdCards[0].id,
        checkerId: buyer.id,
        result: 'LIVE',
        cost: 0.5
      },
      {
        cardId: createdCards[1].id,
        checkerId: buyer.id,
        result: 'DEAD',
        cost: 0.5
      }
    ];

    const createdChecks = [];
    for (const checkData of sampleChecks) {
      const check = await prisma.cardCheck.create({
        data: checkData
      });
      createdChecks.push(check);
      
      // Update card status
      await prisma.creditCard.update({
        where: { id: checkData.cardId },
        data: {
          status: checkData.result,
          isChecked: true,
          checkedAt: new Date(),
          checkedById: checkData.checkerId
        }
      });
    }

    console.log(`Created ${createdChecks.length} sample card checks`);

    // Update buyer balance (deduct check costs)
    await prisma.user.update({
      where: { id: buyer.id },
      data: {
        balance: {
          decrement: createdChecks.length * 0.5
        }
      }
    });

    console.log('Updated buyer balance after checks');

    console.log('\n=== SEED COMPLETED SUCCESSFULLY ===');
    console.log('Sample accounts created:');
    console.log('Admin: username="admin", password="password123"');
    console.log('Seller: username="seller", password="password123"');
    console.log('Buyer: username="buyer", password="password123"');
    console.log('\nSample data:');
    console.log(`- ${createdCards.length} credit cards`);
    console.log(`- ${createdChecks.length} card checks`);
    console.log('\nYou can now test the CVV system!');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
