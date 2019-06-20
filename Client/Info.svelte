<script>
    import T from 'scanex-translations';
    import {createEventDispatcher} from 'svelte';

    export let sceneId = '';
    export let platform = '';
    export let date = '';
    export let time = '';

    T.addText('eng', {
        sceneId: 'Scene ID',
        platform: 'Platform',
        date: 'Acquisition Date',
        time: 'Acqusition Time (UTC)',
        parameter: 'Parameter',
        value: 'Value'
    });

    T.addText('rus', {
        sceneId: 'Идентификатор сцены',
        platform: 'Платформа',
        date: 'Дата съемки',
        time: 'Время съемки (UTC)',
        parameter: 'Параметр',
        value: 'Значение',
    });

    const translate = T.getText.bind(T);
    
    const dispatch = createEventDispatcher();

    let container;

    export const adjustPosition = ({top, left}) => {
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
    };

</script>

<style>
    .info {
        position: absolute;
        background-color: #FFFFFF;
        width: 580px;
    }
    .info .header {
        border-top: 1px solid #D8E1E8;
        border-left: 1px solid #D8E1E8;
        border-right: 1px solid #D8E1E8;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        background-color: #F3F7FA;
    }
    .info .content {
        border: 1px solid #D8E1E8; 
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
    }    
    .info .content th,
    .info .content td {
        border-left: 1px solid #D8E1E8;
    }
    .info .header td:first-child,
    .info .content th:first-child,
    .info .content td:first-child {        
        border-left: none;
    }
    .info .content th {
        padding: 5px 10px 5px 10px;
        color: #92A0AC;
        text-align: left;
    }
    .info .header td,
    .info .content td {
        padding: 8px 10px 8px 10px;
    }
    .info .content td {
        border-top: 1px solid #D8E1E8;        
        color: #455467;
    }
    .info .header td:first-child,
    .info .content th:last-child,
    .info .content td:last-child {
        width: 100%;
    }
    .info .close {
        padding: 10px;
    }
    .info .close i {
        cursor: pointer;
        display: inline-block;
        background-position: center;
        background-repeat: no-repeat;
        background-image: url('close.png');
        width: 10px;
        height: 10px;
    }    
</style>

<div class="info" bind:this="{container}">
    <table class="header" cellpadding="0" cellspacing="0">
        <tr>
            <td>{platform}</td>
            <td>{date}</td>
            <td class="close" on:click|stopPropagation="{() => dispatch('close')}">
                <i></i>
            </td>
        </tr>        
    </table>
    <table class="content" cellpadding="0" cellspacing="0">
        <tr>
            <th>{translate('parameter')}</th>
            <th>{translate('value')}</th>
        </tr>
        <tr>
            <td>{translate('sceneId')}</td>
            <td>{sceneId}</td>
        </tr>
        <tr>
            <td>{translate('platform')}</td>
            <td>{platform}</td>
        </tr>
        <tr>
            <td>{translate('date')}</td>
            <td>{date}</td>
        </tr>
        <tr>
            <td>{translate('time')}</td>
            <td>{time}</td>
        </tr>
    </table>
</div>
