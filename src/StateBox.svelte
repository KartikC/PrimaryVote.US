<script>
    import {
        selectedState
    } from './stores.js';

    export let data;

    function handleClick(data) {
        selectedState.set(data);
    }
</script>

<style>
    .box {
        background-color: #E8F1F2;
        color: #1835A5;
        width: 321px;
        height: 71px;
        margin: 10px;
        border: 3px solid #1835A5;
        box-sizing: border-box;
        box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.25);
        border-radius: 5px;
        text-align: center;
    }
</style>

<div on:click={handleClick(data)} class="box">
    {data.name.toUpperCase()}
</div>