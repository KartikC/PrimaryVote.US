<script>
	import StateList from './StateList.svelte'
	import StateInfo from './StateInfo.svelte'
	import {
		selectedState
	} from './stores.js';

	function resetState() {
		selectedState.set(null);
	}
</script>

{#if $selectedState}
	 <StateInfo/><br/><button on:click={resetState}>back</button>
{:else}
	 <StateList/>
{/if}