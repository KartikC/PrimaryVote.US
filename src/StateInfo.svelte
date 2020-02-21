<script>
    import {
        selectedState
    } from './stores.js';
    let baseURL = 'https://iwillvote.com/register/?lang=en&state='
</script>

<h1>{$selectedState.name}</h1>
<a href="{baseURL+$selectedState.code}">Register Now!</a>