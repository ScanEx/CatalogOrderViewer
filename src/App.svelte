<script>
    import Order from './Order.svelte';
    export let orders = [];
</script>

<style>
    .app {
        width: 390px;
    }    
</style>

<div class="app">    
    {#each orders as x}
    <Order {...x} />
    {/each}    
</div>