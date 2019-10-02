import BaseCompositedComponent from 'js/base/BaseCompositedComponent';
import OrderView from 'catalog-order-viewer';
import Translations from 'scanex-translations';
import {LAYER_ID} from 'js/config/constants/Constants';

export default class OrdersTabComponent extends BaseCompositedComponent {

    init() {
        this._view = this.getParentComponent().getView().addTab({
            id: 'orders',            
            icon: 'sidebar-orders',
            opened: 'sidebar-orders-opened',
            closed: 'sidebar-orders-closed',
            tooltip: Translations.getText('results.orders')
        });        
        this._bindEvents();
    }

    _bindEvents() {
        const application = this.getApplication();
        application.getServiceEvents().on('sidebar:tab:resize', height => {            
            let placeHolder = this.getView();
            placeHolder.style.maxHeight = `${height}px`;
        });                

        const collect_geometries = (rm, orders) => new Promise((resolve, reject) => {
            const sceneids = orders.reduce((a, {regions}) => {
                const x = regions.reduce((b, {granules}) => {
                    const y = granules.reduce((c, {granule: {sceneId}}) => {
                        c[sceneId] = null;
                        return c;
                    }, {});
                    return {...b, ...y};
                }, {});
                return {...a, ...x};
            }, {});

            let query = Object.keys(sceneids).map(x => "(sceneid = '" + x + "')").join(' OR ');
            let rq = {
                layer: LAYER_ID,                
                geometry: true,
                pagesize: 0,
                query: query,
                out_cs: 'EPSG:3857',
            };

            rm.requestVectorLayerSearch(rq)
            .then(response => {
                if (response.Status == 'ok') {                    
                    resolve(response.Result);
                }
                else {
                    reject(response.Result);
                }
            })
            .catch(err => {                
                reject(err);
            });
        });

        application.getAppEvents().on('system:uiElements:created', () => {            
            const rm = application.getRequestManager();
            rm.getCurrentOrders().then (orders => {
                collect_geometries(rm, orders)
                .then(result => {                    
                    const contourController = application.getBridgeController('contour');
                    contourController.addContoursToMapOrders(result);
                    this._orderView = new OrderView({ target: this.getView(), props: {orders} });
                    this._orderView.$on('download', ({detail}) => {
                        rm.downloadRegion(detail);
                    });
                    this._orderView.$on('preview', ({detail}) => {
                        console.log(detail);
                    });
                })
                .catch(console.log);            
            }).catch (e => console.log(e));
        });      
    }   
}