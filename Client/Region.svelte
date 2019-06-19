<script>
    import T from 'scanex-translations';
    export let name = '';
    export let granules = [];
    let expanded = false;    

    T.addText('eng', {
        product: 'Product',
        size: 'Size',
        mb: 'Mb'
    });

    T.addText('rus', {
        product: 'Продукт',
        size: 'Размер',
        mb: 'Мб'
    });

    const translate = T.getText.bind(T);

</script>

<style>    
    .roi {
        margin-top: 8px;
        font-family: 'IBM Plex Sans';
    }
    .roi:last-child {
        margin-bottom: 8px;
    }
    .roi .header {
        padding: 17px 10px 17px 10px;
        cursor: pointer;        
        background-color: #F3F7FA;
        border: 1px solid #D8E1E8;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }    
    .roi .header.collapsed {
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
    }
    .roi .header .toggle {
        display: inline-block;
        font: normal normal normal 14px/1 FontAwesome;
        font-size: inherit;
        text-rendering: auto;
        -webkit-font-smoothing: antialiased;
    }
    .roi .header > *,
    .roi .header > .size > * {
        vertical-align: middle;
    }
    .roi .header > .toggle.expanded::before {
        content: "\f0d7";
    }
    .roi .header > .toggle.collapsed::before {
        content: "\f0da";
    }
    .roi .header .size {
        float: right;
    }
    .roi .header > .size > .download {
        display: inline-block;
        background-image: url('download.png');
        background-position: center;
        background-repeat: no-repeat;
        width: 20px;
        height: 20px;        
    }
    .roi .header > .preview {
        display: inline-block;
        background-image: url('preview.png');
        background-position: center;
        background-repeat: no-repeat;
        width: 16px;
        height: 16px;
    }
    .roi .header > .preview,
    .roi .header > .name {
        margin-left: 10px;
    }
    .roi .content {        
        border-left: 1px solid #D8E1E8;
        border-bottom: 1px solid #D8E1E8;
        border-right: 1px solid #D8E1E8;
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;        
    }
    .roi .content.hidden {
        display: none;
    }
    .roi .content table th,
    .roi .content table td {
        text-align: left;
        border-right: 1px solid #D8E1E8; 
        padding-top: 6px;
        padding-bottom: 6px;
    }
    .roi .content table th:last-child,
    .roi .content table td:last-child {
        border-right: none;
    }
    .roi .content table th:first-child,
    .roi .content table td:first-child {
        padding-left: 32px;
        padding-right: 9px;
    }
    .roi .content table th:nth-child(2),
    .roi .content table td:nth-child(2) {
        padding-left: 9px;
    }
    .roi .content table th {        
        color: #92A0AC;
        border-bottom: 1px solid #D8E1E8;
    }
    .roi .content table td {
        color: #455467;
    }
</style>

<div class="roi">
    <div class="header" class:collapsed="{!expanded}">
        <i class="toggle" on:click|stopPropagation="{() => expanded = !expanded}" class:collapsed="{!expanded}" class:expanded="{expanded}"></i>
        <i class="preview"></i>
        <span class="name">{name}</span>
        <div class="size">
            <span>550 {translate('mb')}</span>
            <i class="download"></i>
        </div>        
    </div>
    <div class="content" class:hidden="{!expanded}">        
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th>{translate('product')}</th>
                <th>{translate('size')}</th>
                <th></th>
            </tr>
            {#each granules as g}
            <tr>
                <td>{g.product.name}</td>
                <td>100 {translate('mb')}</td>
                <td></td>
            </tr>
            {/each}
        </table>
    </div>
</div>