<script>    
    export let type = 'file';    
    export let name = '';
    export let path = '';
    export let selected = false;
    export let expanded = false;
    $: children = [];

    const toggle = () => {
        if (children.length === 0) {
            children = expand (path);
        }
        expanded = !expanded;
    };

    export const expand = path => [];

</script>

<style>
    
</style>

<div>
    <div class="entry">
        {#if selected}
        <input type="checkbox" checked on:click|stopPropagation="{() => selected = false}"/>
        {:else}
        <input type="checkbox" on:click|stopPropagation="{() => selected = true}"/>
        {/if}
        {#if type === 'dir'}
        <i class="dir"></i>
        {:else}
        <i class="file"></i>
        {/if}
        <span>{name}</span>
    </div>
    {#if Array.isArray (children) && children.length > 0 && expanded }
        {#each children as child}
        <svelte:self {...child} />
        {/each}
    {/if}
</div>
