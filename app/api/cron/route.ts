import { NextResponse } from 'next/server';

// This endpoint will be called by Vercel Cron Jobs every 5 minutes
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In a real application, you might want to store this data in a database
    // For now, we'll just log that the cron job ran
    console.log('Cron job executed at:', new Date().toISOString());
    
    // You could call your availability API here and cache the results
    // const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/availability`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Cron job failed' 
    }, { status: 500 });
  }
}