<script>
	import StateList from './StateList.svelte'
	import StateInfo from './StateInfo.svelte'
	import TooWide from './TooWide.svelte'
	import {
		selectedState
	} from './stores.js';
	let w = 50;
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
		height: 75%;
		background: #1835A5;
		overflow: scroll;
	}

	.top {
		position: relative;
		font-weight: bold;
		font-size: 3.75vh;
		color: #1835A5;
		width: 80%;
		height: 100%;
		padding: 0.25em 0 0 0.25em;
		text-align: left;
	}

	:global(html) {
		font-size: 2vw;
		box-sizing: border-box;
		overflow: hidden;
	}

	:global(*, *:before, *:after) {
		box-sizing: inherit;
	}

	:global(body, h1, h2, h3, h4, h5, h6, p, ol, ul) {
		background: #1835A5;
		margin: 0;
		padding: 0;
		font-weight: normal;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		overflow: hidden;
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
</svelte:head>

<div bind:clientWidth={w}></div>
{#if w < 1100}
	{#if $selectedState}
		<StateInfo/>
	{:else}
		<div class="wrapper"> 
			<div class="header">
				<div class="top">
					<span>HOW MANY DAYS ARE LEFT TO REGISTER TO VOTE IN MY PRIMARY?</span>
				</div>
			</div>
			<div class="main">
				<StateList/>
			</div>
		</div>
	{/if}
{:else}
	<TooWide/>
{/if}