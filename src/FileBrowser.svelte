<script>
    import File from './File.svelte';    
    
    export let files = [];
    let container;

    export const adjustPosition = ({top, left}) => {
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
    };

    export const expand = path => [];

</script>

<style>
    .files {
        position: absolute;
        width: 400px;
    }
</style>

<div class="files" bind:this="{container}">
    {#each files as file}
    <File {...file} expand="{expand}" />
    {/each}
</div>