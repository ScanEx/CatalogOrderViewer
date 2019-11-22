<script>
    import File from './File.svelte';
    import {onMount, createEventDispatcher} from 'svelte';
    import T from 'scanex-translations';
    import './FileBrowser.css';
    
    export let files = [];
    let container;
    let outerHeight;
    let outerWidth;

    T.addText('rus', {
        filebrowser: {
            title: 'Выберите файлы для скачивания',
            download: 'Скачать'
        },        
    });

    T.addText('eng', {
        filebrowser: {
            title: 'Select files to download',
            download: 'Download'
        },
        
    });

    export const adjustPosition = ({top, left}) => {
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
    };

    const dispatch = createEventDispatcher();

    onMount(() => adjustPosition({top: 100, left: 300}));

</script>

<svelte:window bind:outerHeight="{outerHeight}" bind:outerWidth="{outerWidth}" />
<div class="files" bind:this="{container}">
    <div class="header">
        <div>{T.getText('filebrowser.title')}</div>
        <i class="icon close" on:click="{() => dispatch('close')}"></i>
    </div>
    <div class="content">
        {#each files as file}
        <File {...file}
            on:expand="{({detail}) => dispatch('expand', detail)}"
            on:selection="{({detail}) => dispatch('selection', detail)}" />
        {/each}
    </div>
    <div class="footer">
        <button on:click="{() => dispatch('download')}">{T.getText('filebrowser.download')}</button>
    </div>
</div>