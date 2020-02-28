<script>
    import {
        fade,
        fly
    } from 'svelte/transition';
</script>

<style>
    .text {
        position: relative;
        margin: 1em;
        width: 80%;
        display: inline-block;
        font-weight: bold;
        color: #E8F1F2;
        text-align: left;
        font-size: 2.5em;
        box-sizing: border-box;
    }
</style>

<span class="text" in:fly="{{ y: 200, duration: 1000 }}" out:fly="{{ y: -200, duration: 1000 }}">
    YOUR WINDOW IS TOO WIDE &#x1F605
</span>