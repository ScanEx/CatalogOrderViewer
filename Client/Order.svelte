<script>
    import Region from './Region.svelte';    
    export let contractId = '';
    export let name = '';
    export let id;
    let regions = [];
    let expanded = false;
    let loaded = false;
    const toggle = () => {
        if (!loaded && !expanded) {
            fetch(`api/Regions/ByOrder/${id}`)
            .then(response => response.json())
            .then(json => {
                loaded = true;
                regions = json;
            })
            .catch(e => console.log(e));
        }
        expanded = !expanded;
    };
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
    <div class="header" on:click|stopPropagation="{toggle}">
        <i class="icon" class:collapsed="{!expanded}" class:expanded="{expanded}"></i>
        <span>{contractId}</span>        
    </div>
    <div class="content" class:hidden="{!expanded}">
        {#each regions as r}
        <Region {...r} />
        {/each}
    </div>
</div>