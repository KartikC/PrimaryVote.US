<script>
    import {
        selectedState
    } from './stores.js';
    import ReminderModule from './ReminderModule.svelte'

    let baseURL = 'https://iwillvote.com/register/?lang=en&state='
    let selectedState_value;

    const unsubscribe = selectedState.subscribe(value => {
        selectedState_value = value;
    });

    $: state = selectedState_value;
    $: dates = selectedState_value.dates;
</script>

<h1>{state.name}</h1>
Last day to register:
<ul>
    <li>in person: {dates.person}</li>
    <li>online: {dates.online}</li>
    <li>by mail: {dates.mail}</li>
</ul>
<a href="{baseURL+state.code}">Register Now!</a>
-or-
<ReminderModule/>