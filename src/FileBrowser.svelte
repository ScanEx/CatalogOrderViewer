<script>
    import File from './File.svelte';
    import {createEventDispatcher} from 'svelte';
    
    export let files = [];
    let container;

    export const adjustPosition = ({top, left}) => {
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
    };

    export const expand = path => [];

    const dispatch = createEventDispatcher();

</script>

<style>
    .files {
        position: absolute;
        width: 400px;
    }
    .files .header i {
        cursor: pointer;
        display: inline-block;
        background-position: center;
        background-repeat: no-repeat;
        background-image: url('close.png');
        width: 10px;
        height: 10px;
    }   
</style>

<div class="files" bind:this="{container}">
    <div class="header">
        <i on:click="{() => dispatch('close')}"></i>
    </div>
    <div class="content">
        {#each files as file}
        <File {...file} expand="{expand}" />
        {/each}
    </div>
</div>