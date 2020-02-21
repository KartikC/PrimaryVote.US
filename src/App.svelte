<script>
	import { onMount } from "svelte";

  	let stateData = [];

	onMount(async () => {
		const res = await fetch(`state-data.json`);
		stateData = await res.json();
		console.log(stateData);
	});
	
</script>

{#each stateData as state}
	<h3>{state.name}</h3>
	vote in person by {state.dates.person}<br>
	vote online by {state.dates.online}<br>
	vote via mail by {state.dates.mail}<br>
	<br>
{/each}