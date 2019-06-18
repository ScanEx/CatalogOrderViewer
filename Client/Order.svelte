<script>
    import Granule from './Granule.svelte';
    export let granules = [];
    export let createDate = '';
    export let number = '';
    let expanded = false;
</script>

<style>
    .order .header > * {
        display: inline-block;
    }
    .order .header {
        cursor: pointer;
    }
    .order .header .icon {
        display: inline-block;
        font: normal normal normal 14px/1 FontAwesome;
        font-size: inherit;
        text-rendering: auto;
        -webkit-font-smoothing: antialiased;
    }
    .order .header > .icon.expanded::before {
        content: "\f0d7";
    }
    .order .header > .icon.collapsed::before {
        content: "\f0da";
    }
    .order .content {
        padding-left: 15px;
    }
    .order .content.hidden {
        display: none;
    }
</style>

<div class="order">
    <div class="header" on:click|stopPropagation="{() => expanded = !expanded}">
        <i class="icon" class:collapsed="{!expanded}" class:expanded="{expanded}"></i>
        <span>{number}</span>
    </div>
    <div class="content" class:hidden="{!expanded}">
        {#each granules as g}
        <Granule {...g} />
        {/each}
    </div>
</div>