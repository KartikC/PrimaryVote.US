<script>
	import StateList from './StateList.svelte'
	import { selectedState } from './stores.js';

	let selectedState_value;

	const unsubscribe = selectedState.subscribe(value => {
		selectedState_value = value;
	});
</script>

<StateList/>
{selectedState_value}