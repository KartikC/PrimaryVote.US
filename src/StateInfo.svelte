<script>
    import {
        selectedState
    } from './stores.js';
    import ReminderModule from './ReminderModule.svelte'
    import Countdown from './Countdown.svelte'

    let baseURL = 'https://iwillvote.com/register/?lang=en&state='
    let selectedState_value;

    const unsubscribe = selectedState.subscribe(value => {
        selectedState_value = value;
    });

    let bestOptionResult = selectedState_value['bestOption']
</script>

<style>
	.flex-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
    }
</style>

<div class="flex-container">
<h1>{selectedState_value.name}</h1>
{#if bestOptionResult}
    <Countdown data={bestOptionResult} />
    <a href="{baseURL+selectedState_value.code}" target="_blank">Register Now!</a>
    {#if bestOptionResult[0] > 7}
    <br/>-or-<br/>
    <ReminderModule/>
    {/if}
{:else}
    it may be too late to register but you can double check <a href="{baseURL+selectedState_value.code}" target="_blank">here.</a>
{/if}
</div>