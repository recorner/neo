import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCVVCategory() {
	try {
		// Check if CVV category already exists
		const existingCategory = await prisma.category.findFirst({
			where: {
				name: {
					equals: 'CVV',
					mode: 'insensitive'
				}
			}
		});

		if (existingCategory) {
			console.log('CVV category already exists with ID:', existingCategory.id);
			return existingCategory;
		}

		// Create CVV category
		const cvvCategory = await prisma.category.create({
			data: {
				name: 'CVV',
				order: 999 // Put it at the end
			}
		});

		console.log('Created CVV category with ID:', cvvCategory.id);
		return cvvCategory;

	} catch (error) {
		console.error('Error creating CVV category:', error);
		throw error;
	}
}

async function main() {
	console.log('Seeding CVV category...');
	await seedCVVCategory();
	console.log('Seeding completed!');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
