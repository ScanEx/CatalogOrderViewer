<script>
    import Order from './Order.svelte';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    const download = ({detail}) => {
        dispatch('download', detail);
    };

    export let orders = [];
</script>

<style>
    .app {
        width: 390px;
    }    
</style>

<div class="app">    
    {#each orders as x}
    <Order on:download="{download}" {...x} />
    {/each}    
</div>