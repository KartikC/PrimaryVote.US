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
		return ((navigator.geolocation !== null) && (navigator.geolocation !== undefined));
		//return true;
	}
</script>

<style>
	.flex-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	    :global(a:link, a:active, a:visited) {
		color: rgb(196, 248, 255);
	}

	:global(a:hover) {
		color: rgb(196, 212, 255);
	}

	:global(body) {
		background-color: rgb(26, 26, 26);
		color: bisque;
	}
</style>

<svelte:head>
	<title>Can I Still Vote? - PrimaryVote.US</title>
	<html lang="en" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>


{#if $selectedState}
	 <StateInfo/><button on:click={resetState}>back</button>
{:else}
	<div class="flex-container">
		{#if supportsGeolocation()}
		<StateLocator/>
		{/if}
		<StateList/>
	</div>
{/if}