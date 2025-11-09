import { json } from '@sveltejs/kit';
import { storage } from '$lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * POST /api/upload-image
 * Upload base64 image to Firebase Storage
 * Body: { imageDataUrl: string, userId: string }
 * Returns: { url: string }
 */
export const POST = async ({ request }: { request: Request }) => {
	try {
		const { imageDataUrl, userId } = await request.json();

		if (!imageDataUrl || !userId) {
			return json({ error: 'Missing imageDataUrl or userId' }, { status: 400 });
		}

		// Create unique filename with timestamp
		const timestamp = Date.now();
		const filename = `shower-selfies/${userId}/${timestamp}.jpg`;

		// Create storage reference
		const storageRef = ref(storage, filename);

		// Upload base64 image
		await uploadString(storageRef, imageDataUrl, 'data_url');

		// Get download URL
		const downloadURL = await getDownloadURL(storageRef);

		return json({ url: downloadURL });
	} catch (error) {
		console.error('Image upload error:', error);
		return json({ error: 'Failed to upload image' }, { status: 500 });
	}
};
