import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { provider } = params;

    if (provider === 'google') {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json(
                { ok: false, error: 'OAuth not configured. Set GOOGLE_CLIENT_ID on Railway.' },
                { status: 501 }
            );
        }
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/google/callback`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
        })}`;
        return NextResponse.redirect(authUrl);
    }

    if (provider === 'apple') {
        const clientId = process.env.APPLE_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json(
                { ok: false, error: 'OAuth not configured. Set APPLE_CLIENT_ID on Railway.' },
                { status: 501 }
            );
        }
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/apple/callback`;
        const authUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'name email',
            response_mode: 'form_post',
        })}`;
        return NextResponse.redirect(authUrl);
    }

    return NextResponse.json(
        { ok: false, error: 'Unknown provider' },
        { status: 400 }
    );
}
