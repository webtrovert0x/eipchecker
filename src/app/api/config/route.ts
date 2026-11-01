import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reownId = process.env.REOWN_ID || '';
  const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '';

  return NextResponse.json({
    reownId,
    registryAddress,
    hasReownId: Boolean(reownId && reownId.trim().length > 0),
    hasPrivateKey: Boolean(process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim().length > 0),
  });
}

