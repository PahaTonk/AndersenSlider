const COUNT_VISIBLE_IMAGE = 8;
const COUNT_PRECENT_WIDTH = +Math.floor(100 / COUNT_VISIBLE_IMAGE);
const MIN_WIDTH_IMAGE = 100;

const GALLERY_POPUP = document.querySelector('.js_popup_gallery');
const GALLERY_TITLE = GALLERY_POPUP.querySelector('.js_gallery_title');
const GALLERY_ACTIVE_ZONE = GALLERY_POPUP.querySelector('.js_active_zone');
const GALLERY_FULL_IMAGE_WRAPPER = GALLERY_POPUP.querySelector('.js_gallery_full_image_wrapper');
const GALLERY_PAGINATION = GALLERY_POPUP.querySelector('.js_gallery_pagination');

const IMG_GALLERY_MINSK_POSTFIX = '_thumbnail_retina';

let galleryFullImage = GALLERY_POPUP.querySelector('.js_gallery_full_image');
let galleryTrack = GALLERY_POPUP.querySelector('.js_gallery_track');
let trackWidth = +GALLERY_ACTIVE_ZONE.offsetWidth;


/**
 * @class SliderLogic
 * @description Экземляр класса строит логику перелистывания и активации элементов
 */
class SliderLogic {
    constructor () {
        this.widthImage = 100;
        this.imageMargin = 0;
        this.indexFullImage = -1;

        this.clickTrackHandler = this.clickTrackHandler.bind(this);
    }
    
    /**
     * @method addedVisibleImage
     * @description метод рассчета количества картинок видимой части дорожки
     * и их стили
     */
    addedVisibleImage () {
        this.widthImage = +Math.floor(trackWidth * COUNT_PRECENT_WIDTH / 100);
        this.imageMargin = (trackWidth - this.widthImage * COUNT_VISIBLE_IMAGE) / COUNT_VISIBLE_IMAGE;

        [ ...minsk._cloneTrackElement.children ].forEach( (element) => {
            element.setAttribute('style', `width: ${this.widthImage}px; margin-right: ${this.imageMargin}px;`);
        } );
    }

    /**
     * @method createFullImage
     * @param {string} src путь к картинке
     * @description создает картинку в блоке js_gallery_full_image
     */
    createFullImage (src) {
        const img = new Image();

        img.src = src;
        img.classList.add('js_gallery_full_image');

        img.addEventListener('load', () => {
            GALLERY_FULL_IMAGE_WRAPPER.classList.add('js_loaded_full_image');
        });

        galleryFullImage = img;

        return img;
    }
    
    /**
     * @method removeActiveElements
     * @description метод очистки активных css-классов
     */
    removeActiveElements (sel) {
        const arrActiveElements = GALLERY_ACTIVE_ZONE.querySelectorAll(`.${sel}`);
        
        [ ...arrActiveElements ].forEach( (element) => element.classList.remove(sel) )
    }
    
    /**
     * @method clickTrackHandler
     * @description обработчик клика по картинке на дорожке
     */
    clickTrackHandler (e) {
        const target = e.target.closest('.js_wrapper_image');

        if (!target) return;

        // получаем пагинационный номер и путь к картинке
        const numberPagination = target.getAttribute('data-number');
        const src = this._arrGalleryImg[numberPagination];

        if (this.indexFullImage === numberPagination) return;

        this.indexFullImage = numberPagination;

        this.removeActiveElements('js_active_wrapper');
        this.removeActiveElements('js_loaded_full_image');
        
        target.classList.add('js_active_wrapper');

        galleryFullImage ? galleryFullImage.setAttribute('src', src) :
                            GALLERY_FULL_IMAGE_WRAPPER.appendChild( this.createFullImage(src) );
    }
}

/**
 * @class ImageDOMElement
 * @description Экземляр класса картинок на дорожке
 */
class ImageDOMElement {

    /**
     * @constructor 
     * @param {string} src путь к картинке
     * @param {array} classListWrapper массив css классов у элемента обертки img
     * @param {array} classListImage массив css классов элемента img
     * @param {number} number порядковый номер
     */
    constructor (src = '', classListWrapper = [], classListImage = [], number = 0 ) {
        this.src = src;
        this.classListWrapper = classListWrapper;
        this.classListImage = classListImage;
        this.number = number;
    }

    /**
     * @method createNodes
     * @description создает обертку картинки с картинкой и спиннером для загрузки внутри
     * @returns node
     */
    createNodes () {
        const image = new Image();
        const wrapper = document.createElement('div');

        image.src = this.src;
        image.classList.add( ...this.classListImage );
        image.addEventListener('load', () => {
            wrapper.classList.add('js_loaded_image');
        });

        wrapper.classList.add( ...this.classListWrapper );
        wrapper.innerHTML = utils.createSpinner();
        wrapper.setAttribute('data-number', this.number);
        wrapper.appendChild(image);
        wrapper.innerHTML += utils.createSpinner();

        return wrapper;
    }

}

/**
 * @class TrackSlider
 * @extends SliderLogic
 * @description Экземпляр класса дорожки картинок
 */
class TrackSlider extends SliderLogic {
    /**
     * Экземпляр класса слайдера
     * @constructor
     * @param {string} location локация для галереи
     * @param {string} ImgMiniEndsrc окончание названия для маленьких картинок в слайдере 
     */
    constructor (location = '', ImgMiniEndsrc = '') {
        super();
        this.location = location;
        this.endsrcImg = ImgMiniEndsrc;
        
        this._cloneTrackElement = galleryTrack.cloneNode();
        this._arrGalleryImg = [];
        this._arrTrackImg = [];
        this._countImage = 0;
    }

    /**
     * @method _addImageTracking 
     * @description конкатенация путей картинок на дорожке
     */
    _addImageTracking () {
            this._arrGalleryImg.map( (item) => {
                const delimiter = item.lastIndexOf('.');
                const arrSubstr = [item.slice(0, delimiter), item.slice(delimiter)];

                this._arrTrackImg.push(`${arrSubstr[0]}${this.endsrcImg}${arrSubstr[1]}`);
            } );
    }

    /**
     * @method _addSrcArr 
     * @description запрос на сервер за данными
     * @returns promise
     */
    _addSrcArr () {
        // времянка
        // return utils.xhrGet('http://127.0.0.1:8000/data/offices.json')
        return Promise.resolve()
            .then( () => office )
            .catch( (err) => console.error(err) );
    }

    /**
     * @method createTemplateImage 
     * @description фабричный метод. Создаёт массив узлов картинок в обертке
     * @returns array nodes
     */
    get createTemplateImage () {
        const nodesArr = [];

        for (let i = 0; i < this._countImage; i++) {
            const CSSClassListWrapper = ['gallery__wrapper', 'track_wrapper_image', 'js_wrapper_image'];
            const CSSClassImage = ['gallery__image', 'track_image', 'js_track_image'];
            const classImage = new ImageDOMElement(this._arrTrackImg[i], CSSClassListWrapper, CSSClassImage, i );

            nodesArr.push( classImage.createNodes() );
        }

        return nodesArr;
    }

    /**
     * @method loadedImage 
     * @description заполняет внутренние свойства, загружает асинхронно картинки
     * @returns promise
     */
    loadedImage () {
        this._addSrcArr()
            .then( data => { 
                this._arrGalleryImg = data[this.location].gallery;
                this._countImage = this._arrGalleryImg.length;
        
                this._addImageTracking();

                return data;
            })
            .then( data => {
                const arr = this.createTemplateImage;

                for (let i = 0; i < this._countImage; i++) {
                    this._cloneTrackElement.appendChild( arr[i] ) ;
                }

                // обработчик клика по картинке на дорожке
                this._cloneTrackElement.addEventListener('click', this.clickTrackHandler)

                return data;
            })
            .then( (data) => {
                this.addedVisibleImage();
            })
            .catch( (err) => console.error(err) );
    }
    
    /**
     * @method appendTrackNodes 
     * @description рендерит готовые узлы
     */
    appendTrackNodes () {
        // времянка
        // utils.showPopup( document.querySelector('.popup-gallery') );
        trackWidth = +GALLERY_ACTIVE_ZONE.offsetWidth;

        galleryTrack.parentElement.replaceChild(this._cloneTrackElement, galleryTrack);

        galleryTrack = this._cloneTrackElement;
    }
}

// времянка
let minsk = new TrackSlider('minsk', '_thumbnail_retina');
minsk.loadedImage();
minsk.appendTrackNodes();
