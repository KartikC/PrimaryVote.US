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
        background-color: #161616;
        width: 300px;
        margin: 10px;
        border: 1px solid black;
        border-radius: 2px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
        padding: 1em;
        margin: 0 0 1em 0;
        text-align: center;
        vertical-align: middle;
    }
</style>

<div on:click={handleClick(data)} class="box">
    {data.name}
</div>