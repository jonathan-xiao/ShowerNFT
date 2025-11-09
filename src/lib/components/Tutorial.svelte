<script lang="ts">
  import { showView, tutorialCompleted } from "$lib/stores";

  let certified = false;

  function proceedToInteractiveTutorial() {
    showView("showertutorial");
  }

  function skipToMinting() {
    showView("minting");
  }
</script>

<div class="app-view space-y-6">
  <!-- Debug Skip Button -->
  <button
    on:click={skipToMinting}
    class="absolute top-2 right-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-1 rounded shadow"
    title="Skip to minting (debug)"
  >
    ⚡ Debug
  </button>

  <h2 class="text-3xl font-bold text-center">
    Step 1: Shower Approved™ Tutorial
  </h2>
  <p class="text-gray-600">
    Before verification, you must be certified in the optimal H₂O-to-epidermis
    application protocol. Please review the following modules.
  </p>
  <div
    class="h-64 overflow-y-scroll p-4 border rounded-lg bg-gray-50 space-y-4 text-sm"
  >
    <h3 class="font-bold">Module 1: Water Temperature Calibration</h3>
    <p>
      A successful ablution requires a precise temperature of 41.5°C (±0.2°).
      Temperatures exceeding this risk epidermal shock, while lower temperatures
      fail to activate the soap-saponification coefficient. Calibrate your
      sensor (hand) accordingly.
    </p>

    <h3 class="font-bold">Module 2: The Lather-Rinse-Repeat Fallacy</h3>
    <p>
      Our research indicates the "repeat" step is a sub-optimal loop propagated
      by shampoo conglomerates. The Groom Protocol dictates a single,
      high-efficiency Lather-Rinse cycle. We are a Proof-of-Lather, not
      Proof-of-Waste, protocol.
    </p>

    <h3 class="font-bold">Module 3: Advanced Towel Dynamics</h3>
    <p>
      Do NOT rub. Rubbing introduces unnecessary friction and micro-abrasions.
      The approved method is a firm, systematic "Pat" (Protocol-Assisted
      Tepid-drying). This ensures moisture removal while maintaining skin
      integrity.
    </p>

    <h3 class="font-bold">Module 4: Interactive Verification Protocol</h3>
    <p>
      Upon agreement to these terms, you will complete a live, webcam-based
      tutorial demonstrating proper shower technique. Our ML-powered pose
      detection system will verify your understanding of: lathering hands,
      scrubbing head, scrubbing arms, and scrubbing armpits. Each action must be
      performed continuously for 10 seconds. Failure to comply will reset the
      verification process.
    </p>
  </div>
  <div class="flex items-center space-x-3">
    <input
      id="tutorial-check"
      type="checkbox"
      bind:checked={certified}
      class="h-5 w-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
    />
    <label for="tutorial-check" class="text-gray-700"
      >I certify I have read and agree to the Groom Protocol<br />Shower
      Verification Terms & Conditions.</label
    >
  </div>
  <button
    on:click={proceedToInteractiveTutorial}
    disabled={!certified}
    class="w-full bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out hover:bg-blue-700"
    class:opacity-50={!certified}
    class:cursor-not-allowed={!certified}
  >
    Proceed to Interactive Tutorial
  </button>
</div>
