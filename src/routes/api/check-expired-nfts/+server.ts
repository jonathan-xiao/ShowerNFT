import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// This endpoint checks for expired NFT for a specific user and sends SMS notifications
// Called from Dashboard component every 30 seconds with userId parameter
export async function GET({ request, url }: RequestEvent) {
	// Get userId from query parameter
	const userId = url.searchParams.get('userId');

	if (!userId) {
		return json({ error: 'userId parameter required' }, { status: 400 });
	}

	// Optional: Simple authentication check (can be removed for demo)
	const authHeader = request.headers.get('authorization');
	const expectedSecret = process.env.CRON_SECRET || process.env.VITE_CRON_SECRET || 'demo-secret';

	const isAuthorized = authHeader === `Bearer ${expectedSecret}`;

	if (!isAuthorized) {
		console.warn('⚠️ Unauthorized NFT expiry check attempt');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		console.log(`🔍 Checking expired NFT for user ${userId}...`);

		// 1. Get user's profile (for name, friend phones, and latest NFT)
		const userRef = doc(db, 'users', userId);
		const userSnap = await getDoc(userRef);

		if (!userSnap.exists()) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const userData = userSnap.data();
		const userName = userData.displayName || 'A fellow CS student';
		const friendPhones = userData.friendsPhoneNumbers || [];
		const latestNFT = userData.latestNFT;

		if (!latestNFT) {
			console.log('ℹ️ No NFT found - user is stinky! 🤢');
			return json({
				success: true,
				message: 'No NFT - user is stinky',
				userId,
				timestamp: new Date().toISOString(),
				checked: 0,
				notified: 0
			});
		}

		if (!latestNFT.isActive) {
			console.log('ℹ️ NFT already marked inactive');
			return json({
				success: true,
				message: 'NFT already inactive',
				userId,
				timestamp: new Date().toISOString(),
				checked: 1,
				notified: 0
			});
		}

		if (friendPhones.length === 0) {
			console.log('⚠️ No friends to notify');
			return json({
				success: true,
				message: 'No friends to notify',
				userId,
				timestamp: new Date().toISOString(),
				checked: 1,
				notified: 0
			});
		}

		const now = Math.floor(Date.now() / 1000); // Current time in seconds
		const expiresAt = latestNFT.expiresAt;

		console.log(`📋 NFT status:`, {
			mintTime: latestNFT.mintTime,
			customTimeout: latestNFT.customTimeout,
			expiresAt,
			now,
			expired: now >= expiresAt
		});

		// Check if expired
		if (now >= expiresAt) {
			console.log(`⏰ NFT has expired! Notifying friends...`);

			// Send SMS to each friend
			const twilioAccountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
			const twilioAuthToken = process.env.VITE_TWILIO_AUTH_TOKEN;
			const twilioPhoneNumber = process.env.VITE_TWILIO_PHONE_NUMBER;

			if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
				console.error('❌ Twilio credentials not configured');
				return json({ error: 'Twilio not configured' }, { status: 500 });
			}

			const message = `🚿 ALERT: ${userName} is now officially STINKY! Their Proof-of-Lather NFT has expired. Shame them into showering! - The Groom Protocol`;

			let notifiedCount = 0;

			// Send SMS to each friend
			for (const friendPhone of friendPhones) {
				try {
					// Twilio REST API call
					const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

					const formData = new URLSearchParams();
					formData.append('To', friendPhone);
					formData.append('From', twilioPhoneNumber);
					formData.append('Body', message);

					const response = await fetch(twilioUrl, {
						method: 'POST',
						headers: {
							Authorization:
								'Basic ' +
								Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						body: formData.toString()
					});

					if (response.ok) {
						console.log(`✅ SMS sent to ${friendPhone}`);
						notifiedCount++;
					} else {
						const errorData = await response.json();
						console.error(`❌ Failed to send SMS to ${friendPhone}:`, errorData);
					}
				} catch (error) {
					console.error(`❌ Error sending SMS to ${friendPhone}:`, error);
				}
			}

			// Mark NFT as inactive in Firestore
			await updateDoc(userRef, {
				'latestNFT.isActive': false,
				'latestNFT.expiredAt': now,
				'latestNFT.notificationsSent': true,
				'latestNFT.notifiedAt': now
			});

			console.log(`✅ NFT marked as inactive`);

			return json({
				success: true,
				message: `NFT expired, notifications sent`,
				userId,
				userName,
				timestamp: new Date().toISOString(),
				checked: 1,
				notified: notifiedCount,
				friendCount: friendPhones.length
			});
		} else {
			// Not expired yet
			console.log(`ℹ️ NFT still valid`);
			return json({
				success: true,
				message: 'NFT still valid',
				userId,
				timestamp: new Date().toISOString(),
				checked: 1,
				notified: 0
			});
		}
	} catch (error: any) {
		console.error('❌ NFT expiry check error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
