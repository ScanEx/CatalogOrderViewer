<script>
    import Order from './Order.svelte';
    export let items = [];
</script>

<div>
    {#each items as item}
    <Order {...item} />
    {/each}
</div>