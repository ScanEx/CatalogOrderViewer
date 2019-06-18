<script>
    export let sceneId = '';
    let expanded = false;
</script>

<style>    
    .granule {
        margin-top: 8px;
    }
    .granule:last-child {
        margin-bottom: 8px;
    }
    .granule .header {
        cursor: pointer;
        height: 44px;
        padding: 17px 10px 17px 10px;
        background-color: #F3F7FA;
        border: 1px solid #D8E1E8;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }
    .granule .header .icon {
        display: inline-block;
        font: normal normal normal 14px/1 FontAwesome;
        font-size: inherit;
        text-rendering: auto;
        -webkit-font-smoothing: antialiased;
    }
    .granule .header > .icon.expanded::before {
        content: "\f0d7";
    }
    .granule .header > .icon.collapsed::before {
        content: "\f0da";
    }
</style>

<div class="granule">
    <div class="header" on:click|stopPropagation="{() => expanded != expanded}">
        <i class="icon" class:expanded="{expanded}" class:collapsed="{!expanded}"></i>
        <span>{sceneId}</span>
    </div>
    <div class="content">
    </div>
</div>