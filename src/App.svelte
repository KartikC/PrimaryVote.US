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
	}
</script>

<style>
	.wrapper {
		width: 100%;
		height: 100%;
	}

	.wrapper>.header {
		height: 25%;
		background: #E8F1F2;
	}

	.wrapper>.main {
		height: 65%;
		background: #1835A5;
		overflow: scroll;
	}

	.wrapper>.footer {
		height: 10%;
		background: #1835A5;
	}

	:global(html) {
		box-sizing: border-box;
		font-size: 16px;
	}

	:global(*, *:before, *:after) {
		box-sizing: inherit;
	}

	:global(body, h1, h2, h3, h4, h5, h6, p, ol, ul) {
		margin: 0;
		padding: 0;
		font-weight: normal;
	}

	:global(ol, ul) {
		list-style: none;
	}

	:global(img) {
		max-width: 100%;
		height: auto;
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
	<div class="wrapper">
		<div class="header">
		{#if supportsGeolocation()}
		<StateLocator/>
		{/if}
		</div>
		<div class="main">
			<StateList/>
		</div>
		<div class="footer">test</div>
	</div>
{/if}