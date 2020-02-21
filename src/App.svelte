<script>
	import StateList from './StateList.svelte'
	import StateInfo from './StateInfo.svelte'
	import { selectedState } from './stores.js';

	let selectedState_value;

	const unsubscribe = selectedState.subscribe(value => {
		selectedState_value = value;
	});

	function resetState() {
		selectedState.set(null)
	}
</script>

{#if selectedState_value}
	 <StateInfo data = {selectedState_value}/>
{:else}
	 <StateList/>
{/if}
