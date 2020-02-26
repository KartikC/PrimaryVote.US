<script>
	import StateList from './StateList.svelte'
	import StateInfo from './StateInfo.svelte'
	import StateLocator from './StateLocator.svelte'
	import {
		selectedState
	} from './stores.js';

	function resetState() {
		selectedState.set(null);
	}

	function supportsGeolocation() {
		//return ((navigator.geolocation !== null) && (navigator.geolocation !== undefined));
		return true;
	}
</script>

{#if $selectedState}
	 <StateInfo/><br/><button on:click={resetState}>back</button>
{:else}
	{#if supportsGeolocation()}
	<StateLocator/>
	{/if}
	<StateList/>
{/if}