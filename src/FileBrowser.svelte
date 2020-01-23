<script>
    import File from './File.svelte';
    import {onMount, createEventDispatcher, onDestroy} from 'svelte';
    import T from 'scanex-translations';
    import './FileBrowser.css';
    
    export let files = [];
    let container;
    let outerHeight;
    let outerWidth;
    let size = 0.0;

    $: kBytes = size / 1024;
    $: mBytes = kBytes / 1024;

    T.addText('rus', {
        filebrowser: {
            title: 'Выбранные файлы',
            download: 'Скачать',            
        },
        size: 'Размер',
        b: 'б',
        kb: 'Кб',
        mb: 'Мб'        
    });

    T.addText('eng', {
        filebrowser: {
            title: 'Selected files',
            download: 'Download',            
        },
        size: 'Size',
        b: 'b',
        kb: 'Kb',
        mb: 'Mb',        
    });

    export const adjustPosition = ({top, left}) => {
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
    };

    const dispatch = createEventDispatcher();

    onMount(() => adjustPosition({top: 100, left: 300}));

    let selected = {};

    function selection ({detail}) {
        const {path, state} = detail;
        if(state === 1) {
            selected[path] = detail.size;
        }
        else {
            delete selected[path];
        }
        size = Object.keys(selected).reduce((a, s) => a + selected[s], 0);
        dispatch('selection', detail);
    }

    function download () {
        if(Object.keys(selected).length > 0) {
            dispatch('download');
        }
    }

</script>

<svelte:window bind:outerHeight="{outerHeight}" bind:outerWidth="{outerWidth}" />
<div class="files" bind:this="{container}">
    <div class="header">
        <div>{T.getText('filebrowser.title')}</div>
        {#if mBytes >= 1.0}
            <div class="size">{mBytes.toFixed(1)} {T.getText('mb')}</div>
        {:else if kBytes >= 1.0}
            <div class="size">{kBytes.toFixed(1)} {T.getText('kb')}</div>
        {:else}
            <div class="size">{size.toFixed(1)} {T.getText('b')}</div>
        {/if}
        <i class="icon close" on:click="{() => dispatch('close')}"></i>
    </div>    
    <div class="content">
        {#each files as file}
        <File {...file}
            on:expand="{({detail}) => dispatch('expand', detail)}"
            on:selection="{selection}" />
        {/each}
    </div>
    <div class="footer">
        <button on:click="{download}">{T.getText('filebrowser.download')}</button>
    </div>
</div>