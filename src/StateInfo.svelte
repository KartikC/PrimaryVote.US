<script>
    import {
        selectedState
    } from './stores.js';
    let baseURL = 'https://iwillvote.com/register/?lang=en&state='
</script>

<h1>{$selectedState.name}</h1>
Last day to register:
<ul>
    <li>in person: {$selectedState.dates.person}</li>
    <li>online: {$selectedState.dates.online}</li>
    <li>by mail: {$selectedState.dates.mail}</li>
</ul>

<a href="{baseURL+$selectedState.code}">Register Now!</a>