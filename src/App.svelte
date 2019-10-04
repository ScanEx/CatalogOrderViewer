<script>
    import Order from './Order.svelte';
    import {createEventDispatcher} from 'svelte';
    import {visibility} from './store.js';

    const dispatch = createEventDispatcher();

    const download = ({detail}) => {
        dispatch('download', detail);
    };

    const preview = ({detail}) => {
        dispatch('preview', detail);
    };

    export let orders = [];

    export function resetVisibility () {
        visibility.set(false);
    } 
</script>

<style>
    .app {
        width: 390px;
    }    
</style>

<div class="app">    
    {#each orders as x}
    <Order on:download="{download}" on:preview="{preview}" {...x} />
    {/each}    
</div>