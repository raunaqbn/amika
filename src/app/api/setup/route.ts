import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This endpoint sets up the default user and migrates existing data
// It should only be run once during initial setup
export async function POST() {
  try {
    // Default user credentials as specified
    const defaultUserData = {
      email: 'raunaq.naidu@gmail.com',
      password: 'raunaq1234',
      name: 'Raunaq Naidu',
      birthday: '01/01/1991',
    };

    // Parse birthday (MM/DD/YYYY format)
    const [month, day, year] = defaultUserData.birthday.split('/').map(Number);
    const birthdayDate = new Date(year, month - 1, day, 12, 0, 0);

    // Check if user already exists
    let user = await prisma.user.findByEmail(defaultUserData.email);

    if (!user) {
      // Create the default user
      user = await prisma.user.create({
        email: defaultUserData.email,
        password: defaultUserData.password,
        name: defaultUserData.name,
        birthday: birthdayDate,
      });

      console.log('Created default user:', user.email);
    } else {
      console.log('Default user already exists:', user.email);
    }

    // Migrate all existing data (records with null userId) to this user
    await prisma.migrateDataToUser(user.id);

    console.log('Migrated existing data to default user');

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}

// GET to check if setup has been completed
export async function GET() {
  try {
    const user = await prisma.user.findByEmail('raunaq.naidu@gmail.com');

    return NextResponse.json({
      setupComplete: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
      } : null,
    });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
