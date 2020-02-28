<script>
    import {
        selectedState
    } from './stores.js';

    import Countdown from './Countdown.svelte'

    export let data;

    function handleClick(data) {
        selectedState.set(data);
    }
</script>

<style>
    .box {
        position: relative;
        background-color: #1835A5;
        margin: 10px;
        display:inline-block;
        width: 321px;
        height: 71px;
        border: 3px solid #E8F1F2;
        box-sizing: border-box;
        box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.25);
    }
    .name {
        position: absolute;
        font-weight: bold;
        color: #E8F1F2;
        left: 5%;
        top: 30%;
        font-size: 1.5em;
    }
    .number {
        position: absolute;
        font-weight: bold;
        right: 5%;
        top: 30%;
        font-size: 1.5em;
    }
</style>

<div on:click={handleClick(data)} class="box">
    <div class="name">{data.name.toUpperCase()}</div>
    {#if data.bestOption}
         <div class="number"><Countdown data={data.bestOption}/></div>
    {/if}
</div>