const QUANTITY_VISIBLE_IMAGE = 8;
const COUNT_PERCENT_WIDTH = +Math.floor(100 / QUANTITY_VISIBLE_IMAGE);
const MIN_WIDTH_IMAGE = 90;

const GALLERY_POPUP = document.querySelector('.js_popup_gallery');
const GALLERY_TITLE = GALLERY_POPUP.querySelector('.js_gallery_title');
const GALLERY_ACTIVE_ZONE = GALLERY_POPUP.querySelector('.js_active_zone');
const GALLERY_FULL_IMAGE_WRAPPER = GALLERY_POPUP.querySelector('.js_gallery_full_image_wrapper');
const GALLERY_PAGINATION = GALLERY_POPUP.querySelector('.js_gallery_pagination');
const GALLERY_PAGINATION_START = GALLERY_PAGINATION.querySelector('.js_start_number');
const GALLERY_PAGINATION_END = GALLERY_PAGINATION.querySelector('.js_end_number');

const IMG_GALLERY_MINSK_POSTFIX = '_thumbnail_retina';

let galleryFullImage = GALLERY_POPUP.querySelector('.js_gallery_full_image');
let galleryTrack = GALLERY_POPUP.querySelector('.js_gallery_track');
let trackVisibleWidth = +GALLERY_ACTIVE_ZONE.offsetWidth;
//времянка! при закрытии попапа не забыть прописать изменение на 0 и удалить обработчик clickButtonArrow (GALLERY_ACTIVE_ZONE)
let dataPosition = 0;


/**
 * @class SliderLogic
 * @description Экземляр класса строит логику перелистывания и активации элементов
 */
class SliderLogic {
    constructor () {
        this.quantityVisibleImage = QUANTITY_VISIBLE_IMAGE;
        this.widthImage = 100;
        this.imageMargin = 0;
        this.trackWidth = 500;
        this.indexOldImage = -1;
        this.coordTrackX = 0;
        this.translateX = 0;
        this.compensation = 1;
        this.activeTrigger = 'js_next_visible';

        this.clickTrackHandler = this.clickTrackHandler.bind(this);
        this.clickButtonArrow = this.clickButtonArrow.bind(this);
    }
    
    /**
     * @method addedVisibleImage
     * @description метод рассчета количества картинок видимой части дорожки
     * и общей ширины дорожки
     */
    addedVisibleImage (recursion) {
        this.widthImage = +Math.floor(trackVisibleWidth * COUNT_PERCENT_WIDTH / 100);
        
        if (this.widthImage < MIN_WIDTH_IMAGE) {
            --this.quantityVisibleImage;
            addedVisibleImage(true);
        }

        const balance = this._countImage % this.quantityVisibleImage;

        this.imageMargin = (trackVisibleWidth - this.widthImage * this.quantityVisibleImage) / this.quantityVisibleImage;
        this.trackWidth = (this.widthImage + this.imageMargin) * this._countImage;
        this.translateX = trackVisibleWidth - this.widthImage - this.imageMargin;
        

        if (recursion) return;

        // Добавление стилей и классов-триггеров картинкам
        [ ...this._cloneTrackElement.children ].forEach( (element, index) => {

            element.setAttribute('style', `width: ${this.widthImage}px; margin-right: ${this.imageMargin}px;`);
            const numberImage = index + 1;

            if ( numberImage === this.quantityVisibleImage ) {
                element.classList.add('js_next_visible');
                this._cloneTrackElement.children[index - balance].classList.add('js_prev_visible');

            } else if ( numberImage % this.quantityVisibleImage === 0 ) {
                this._cloneTrackElement.children[index - this.compensation].classList.add('js_next_visible');
                this._cloneTrackElement.children[index - balance - this.compensation].classList.add('js_prev_visible');
            }
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
     * 
     */
    scrollVisibleImages (translate) {
        this.coordTrackX += translate;

        if (this.coordTrackX < 0) {
            this._cloneTrackElement.setAttribute('style', `transform: translateX(${this.coordTrackX}px);`);
        } else {
            this.coordTrackX = 0;
            this._cloneTrackElement.setAttribute('style', `transform: translateX(${this.coordTrackX}px);`);
        }
    }

    /**
     * @method clickTrackHandler
     * @description обработчик клика по картинке на дорожке
     */
    clickTrackHandler (e) {
        const target = e.target.closest('.js_wrapper_image');

        if (!target) return;

        // получаем пагинационный номер и путь к картинке
        dataPosition = +target.getAttribute('data-number');
        const src = this._arrGalleryImg[dataPosition];

        if (this.indexOldImage === dataPosition) return;

        // проверка на класс-триггер
        if (target.classList.contains(this.activeTrigger) && this.indexOldImage < dataPosition) {
            this.scrollVisibleImages(-this.translateX);
        } else if (target.classList.contains(this.activeTrigger)) {
            this.scrollVisibleImages(this.translateX);
        }

        this.indexOldImage = dataPosition;

        this.removeActiveElements('js_active_wrapper');
        this.removeActiveElements('js_loaded_full_image');
        this.changeCurrentNumberPagination(dataPosition);
        
        target.classList.add('js_active_wrapper');

        if (galleryFullImage) {
            galleryFullImage.setAttribute('src', src);
        } else {
            GALLERY_FULL_IMAGE_WRAPPER.innerHTML += utils.createSpinner();
            GALLERY_FULL_IMAGE_WRAPPER.appendChild( this.createFullImage(src) );
        }
    }

    /**
     * @method clickButtonArrow
     * @description Управление нажатими на кнопки вправо/влево
     */
    clickButtonArrow (e) {
        if (e.target.classList.contains('js_left')) {
            if (--dataPosition < 0) {
                dataPosition = this._countImage - 1;
            }
            
            this.activateSelectedImage(dataPosition);

        } else if (e.target.classList.contains('js_right')) {
            if (++dataPosition > this._countImage - 1) {
                dataPosition = 0;
            }
            
            this.activateSelectedImage(dataPosition);
        }
    }

    /**
     * @method addEndNumberPagination
     * @param {number} number
     * @description задает конечную цифру в пагинации
     */
    addEndNumberPagination (number) {
        GALLERY_PAGINATION_END.textContent = number;
    }

    /**
     * @method changeCurrentNumberPagination
     * @param {number} number
     * @description изменяет текущую цифру в пагинации
     */
    changeCurrentNumberPagination (number) {
        GALLERY_PAGINATION_START.textContent = number+1;
    }

    /**
     * @method activateSelectedImage
     * @param {number} number 
     * @description активирует картинку в дорожке
     */
    activateSelectedImage (number) {
        this._cloneTrackElement.children[number].click();
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
     * @method addSrcArr 
     * @description запрос на сервер за данными
     * @returns promise
     */
    addSrcArr () {
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
    createTemplateImage () {
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
        return this.addSrcArr()
            .then( data => { 
                this._arrGalleryImg = data[this.location].gallery;
                this._countImage = this._arrGalleryImg.length;
        
                this._addImageTracking();

                return data;
            })
            .then( data => {
                const arr = this.createTemplateImage();

                for (let i = 0; i < this._countImage; i++) {
                    this._cloneTrackElement.appendChild( arr[i] ) ;
                }

                return data;
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
        trackVisibleWidth = +GALLERY_ACTIVE_ZONE.offsetWidth;

        galleryTrack.parentElement.replaceChild(this._cloneTrackElement, galleryTrack);

        galleryTrack = this._cloneTrackElement;
    }
}

/**
 * @class Slider
 * @extends TrackSlider
 * @description Экземпляр класса полного слайдера
 */
class Slider extends TrackSlider {
    constructor (location = '', ImgMiniEndsrc = '') {
        super(location, ImgMiniEndsrc);
    }

    /**
     * @method projectAssembly
     * @description сборка слайдера
     */
    projectAssembly () {
        this.loadedImage()
            .then( (data) => {
                // обработчик клика по картинке на дорожке
                this._cloneTrackElement.addEventListener('click', this.clickTrackHandler);
                GALLERY_ACTIVE_ZONE.addEventListener('click', this.clickButtonArrow);

                return data;
            })
            .then( (data) => {
                this.addedVisibleImage();
                this.appendTrackNodes();
                this.activateSelectedImage(dataPosition);
                this.addEndNumberPagination(this._countImage);

                return data;
            })
    }
}

// времянка
let minsk = new Slider('minsk', '_thumbnail_retina');
minsk.projectAssembly();
