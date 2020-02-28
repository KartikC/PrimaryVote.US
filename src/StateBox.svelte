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
        margin-bottom: 1.5em;
        display:inline-block;
        width: 80%;
        height: 8em;
        border: 0.5em solid #E8F1F2;
        box-sizing: border-box;
        box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.50);
    }
    .name {
        font-weight: bold;
        color: #E8F1F2;
        width: 80%;
        height: 100%;
        font-size: 3em;
        text-align: left;
        padding-left: 1em;
        line-height: 230%;
        float: left;
    }
    .number {
        font-weight: bold;
        width: 20%;
        top: 30%;
        height: 100%;
        font-size: 3em;
        text-align: right;
        padding-right: 1em;
        line-height: 230%;
        float: right;
    }
</style>

<div on:click={handleClick(data)} class="box">
    <div class="name">{data.name.toUpperCase()}</div>
    {#if data.bestOption}
         <div class="number"><Countdown data={data.bestOption}/></div>
    {/if}
</div>