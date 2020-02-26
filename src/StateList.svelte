<script>
    import {
        onMount
    } from "svelte";

    import {
        stateData
    } from './stores.js';

    let tempData = []

    import StateBox from './StateBox.svelte';

    onMount(async () => {
        const res = await fetch(`state-data.json`);
        tempData = await res.json();
        stateData.set(tempData);
    });

</script>

{#each Object.entries(tempData) as state}
    <StateBox data={state[1]}/>
{/each}