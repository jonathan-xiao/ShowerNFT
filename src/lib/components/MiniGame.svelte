<script lang="ts">
    import { onMount } from 'svelte';
    import { showView } from '$lib/stores';
    import SequenceGame from './SequenceGame.svelte';
    import Captcha from './Captcha.svelte';
    import WouldYouRather from './WouldYouRather.svelte';

    const games = [SequenceGame, Captcha, WouldYouRather];
    let currentGameIndex = 0;

    function handleGameComplete() {
        currentGameIndex++;
        
        if (currentGameIndex >= games.length) {
            // All games completed, go to minting
            showView('minting');
        }
    }
</script>

<div class="app-view space-y-6 text-center">
    <!-- Progress Indicator -->
    <div class="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <p class="text-sm font-medium text-blue-800">
            Challenge {currentGameIndex + 1} of {games.length}
        </p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style="width: {((currentGameIndex) / games.length) * 100}%"
            ></div>
        </div>
    </div>

    <!-- Current Game -->
    <svelte:component this={games[currentGameIndex]} onComplete={handleGameComplete} />
</div>
