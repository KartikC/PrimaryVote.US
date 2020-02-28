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
        font-size: 2em;
        box-sizing: border-box;
    }
</style>

<span class="text" in:fly="{{ y: 200, duration: 1000 }}" out:fly="{{ y: -200, duration: 1000 }}">
    YOUR BROWSER WINDOW IS TOO WIDE<br/>MAKE IT SMALLER TO CONTINUE &#x1F605
</span>