<script>
    import {
        onMount
    } from "svelte";
    import StateBox from './StateBox.svelte';

    let stateData = [];

    onMount(async () => {
        const res = await fetch(`state-data.json`);
        stateData = await res.json();
        console.log(stateData);
    });
</script>

{#each stateData as state}
    <StateBox data={state}/>
{/each}