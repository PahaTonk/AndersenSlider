//начальные опции
const QUANTITY_VISIBLE_IMAGE = 8;
const COUNT_PERCENT_WIDTH = +Math.floor(100 / QUANTITY_VISIBLE_IMAGE);
const MIN_WIDTH_IMAGE = 90;
const IMG_GALLERY_MINSK_POSTFIX = '_thumbnail_retina';
const CSS_CLASS_OPTION = {
    'full-image' : 'js_gallery_full_image',
    'loaded-full-image' : 'js_loaded_full_image',
    'active-track-element' : 'js_active_wrapper',
    'loaded-track-image' : 'js_loaded_image',
    'default-wrapper-image' : ['gallery__secondary-slide', 'gallery__wrapper', 'track_wrapper_image', 'js_wrapper_image'],
    'default-track-image' : ['gallery__image', 'track_image', 'js_track_image'],
    'interactive-dot' : 'js_next_track',
    'last-interactive-dot' : 'js_end_track',
    'button-arrow-right' : 'js_right',
    'button-arrow-left' : 'js_left',
}

// элементы галереи
const GALLERY_POPUP = document.querySelector('.js_popup_gallery');
const GALLERY_TITLE = GALLERY_POPUP.querySelector('.js_gallery_title');
const GALLERY_ACTIVE_ZONE = GALLERY_POPUP.querySelector('.js_active_zone');
const GALLERY_FULL_IMAGE_WRAPPER = GALLERY_POPUP.querySelector('.js_gallery_full_image_wrapper');
const GALLERY_PAGINATION = GALLERY_POPUP.querySelector('.js_gallery_pagination');
const GALLERY_PAGINATION_START = GALLERY_PAGINATION.querySelector('.js_start_number');
const GALLERY_PAGINATION_END = GALLERY_PAGINATION.querySelector('.js_end_number');
const GALLERY_BUTTON_RIGHT = GALLERY_POPUP.querySelector( CSS_CLASS_OPTION['button-arrow-right'] );

// изменяемые элементы галереи
let galleryFullImage = GALLERY_POPUP.querySelector( CSS_CLASS_OPTION['full-image'] );
let galleryTrack = GALLERY_POPUP.querySelector('.js_gallery_track');

// изменяемые данные (общие для всех галерей)
let trackVisibleWidth = +GALLERY_ACTIVE_ZONE.offsetWidth;
//ЗАМЕТКА! при закрытии попапа не забыть прописать изменение на 0 и удалить обработчик clickButtonArrow (GALLERY_ACTIVE_ZONE)
let dataPosition = 0;
let arrInteractiveDots = [];



/**
 * @class SliderLogic
 * @description Экземляр класса строит логику перелистывания и активации элементов
 */
class SliderLogic {
    constructor () {
        this.quantityVisibleImage = QUANTITY_VISIBLE_IMAGE;
        this._widthImage = 100;
        this._imageMargin = 0;
        this._trackWidth = 500;
        this._indexOldImage = -1;
        this._coordTrackX = 0;
        this._translateX = 0;
        this._quantityImageRetention = 0;
        this._order = true;

        this._clickTrackHandler = this.clickTrackHandler.bind(this);
        this._clickButtonArrow = this.clickButtonArrow.bind(this);
        this._clickFullImageHandler = this.clickFullImageHandler.bind(this);
    }

    updateOption(numberPosition = 0) {
        dataPosition = numberPosition;
        GALLERY_ACTIVE_ZONE.removeEventListener('click', this._clickButtonArrow);
        GALLERY_FULL_IMAGE_WRAPPER.removeEventListener('click', this._clickFullImageHandler);
    }
    
    /**
     * @method addedVisibleImage
     * @description метод рассчета количества картинок видимой части дорожки
     * и общей ширины дорожки
     */
    addedVisibleImage (recursion) {
        this._widthImage = +Math.floor(trackVisibleWidth * COUNT_PERCENT_WIDTH / 100);
        
        if (this._widthImage < MIN_WIDTH_IMAGE) {
            --this.quantityVisibleImage;
            this.addedVisibleImage(true);
        }
        
        this._imageMargin = (trackVisibleWidth - this._widthImage * this.quantityVisibleImage) / this.quantityVisibleImage;
        this._trackWidth = (this._widthImage + this._imageMargin) * this._quantityAllImage;
        this._translateX = trackVisibleWidth - this._widthImage - this._imageMargin;
        
        if (recursion) return;

        // Добавление стилей оберткам картинок
        [ ...this._cloneTrackElement.children ].forEach( (element) => {
            element.setAttribute('style', `width: ${this._widthImage}px; margin-right: ${this._imageMargin}px;`);
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
        img.classList.add( CSS_CLASS_OPTION['full-image'] );
        
        img.addEventListener('load', () => {
            GALLERY_FULL_IMAGE_WRAPPER.classList.add( CSS_CLASS_OPTION['loaded-full-image'] );
        });

        galleryFullImage = img;

        return img;
    }
    
    /**
     * @method scrollVisibleImages
     * @param {number} translate сдвиг дорожки по оси Х
     * @description управление скроллингом дорожки
     */
    scrollVisibleImages (translate) {

        this._coordTrackX += translate;

        if (this._coordTrackX < 0) {
            this._cloneTrackElement.setAttribute('style', `transform: translateX(${this._coordTrackX}px);`);
        } else {
            this._coordTrackX = 0;
            this._cloneTrackElement.setAttribute('style', `transform: translateX(${this._coordTrackX}px);`);
        }
    }

    /**
     * @method clickFullImageHandler
     * @description обработчик клика по большой картинке
     */
    clickFullImageHandler (e) {
        if (!e.target.classList.contains( CSS_CLASS_OPTION['full-image'] )) return;

        GALLERY_BUTTON_RIGHT.click();
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

        if (this._indexOldImage === dataPosition) return;
        
        this.removeCSSClassSelectedElements( CSS_CLASS_OPTION['active-track-element'] );
        this.removeCSSClassSelectedElements( CSS_CLASS_OPTION['loaded-full-image'] );
        this.changeCurrentNumberPagination(dataPosition);
        
        target.classList.add( CSS_CLASS_OPTION['active-track-element'] );

        if (galleryFullImage) {
            galleryFullImage.setAttribute('src', src);
        } else {
            GALLERY_FULL_IMAGE_WRAPPER.innerHTML += utils.createSpinner();
            GALLERY_FULL_IMAGE_WRAPPER.appendChild( this.createFullImage(src) );
        }

        // работа с перелистыванием дорожек
        if (target.classList.contains( CSS_CLASS_OPTION['last-interactive-dot'] )) {
            const retentionWidth = this._quantityImageRetention * (this._widthImage + this._imageMargin);
            
            this.checkOrderTrack();

            if (dataPosition > this._indexOldImage) {
                this.scrollVisibleImages(-retentionWidth);
            } else {
                this.scrollVisibleImages(retentionWidth);
            }
            
        } else if (target.classList.contains( CSS_CLASS_OPTION['interactive-dot'] )) {

            if (dataPosition > this._indexOldImage) {
                this.scrollVisibleImages(-this._translateX);
            } else {
                this.scrollVisibleImages(this._translateX);
            }

        }

        this._indexOldImage = dataPosition;
    }

    /**
     * @method clickButtonArrow
     * @description Управление нажатими на кнопки вправо/влево
     */
    clickButtonArrow (e) {
        if ( e.target.classList.contains( CSS_CLASS_OPTION['button-arrow-left'])  ) {
            if (this._order && this._cloneTrackElement.children[dataPosition].classList.contains( CSS_CLASS_OPTION['interactive-dot'] )) {
                this.scrollVisibleImages(this._translateX);
            }

            if (--dataPosition < 0) {
                dataPosition = this._quantityAllImage - 1;
                const translateX = (this._quantityAllImage - this.quantityVisibleImage) * (this._widthImage + this._imageMargin);

                this.scrollVisibleImages(-translateX);
                this.checkOrderTrack();
            }
            
            this.activateSelectedImage(dataPosition);

        } else if (e.target.classList.contains( CSS_CLASS_OPTION['button-arrow-right']) ) {
            if (!this._order && this._cloneTrackElement.children[dataPosition].classList.contains( CSS_CLASS_OPTION['interactive-dot'] )) {
                this.scrollVisibleImages(-this._translateX);
            }

            if (++dataPosition > this._quantityAllImage - 1) {
                dataPosition = 0;
                
                this.scrollVisibleImages(Math.abs(this._coordTrackX));
                this.checkOrderTrack();
            }
            
            this.activateSelectedImage(dataPosition);
        }
    }

    /**
     * @method createInteractiveDots
     * @param {number} index начальное значение отсчета интерактивных точек
     * @description Подсчитывает количество интерактивных точек и расставляет соответствующие css-классы
     * на дороке
     */
    createInteractiveDots (index = this.quantityVisibleImage) {
        if (this.quantityVisibleImage === 1 || this.quantityVisibleImage === 2 || this.quantityVisibleImage === this._quantityAllImage) return;

        arrInteractiveDots = [];
        const arrOldInteractiveDots = this._cloneTrackElement.querySelectorAll( CSS_CLASS_OPTION['interactive-dot'] );
        
        if (arrOldInteractiveDots) {
            this.removeCSSClassSelectedElements( CSS_CLASS_OPTION['interactive-dot'] );
            this.removeCSSClassSelectedElements( CSS_CLASS_OPTION['last-interactive-dot'] );
        }

        arrInteractiveDots.push(index);
        --index;

        while (index <= this._quantityAllImage) {
            index += this.quantityVisibleImage;

            if (index > this._quantityAllImage) {
                const indexLastElement = this._order ? arrInteractiveDots[arrInteractiveDots.length - 1] : arrInteractiveDots[0];

                this._cloneTrackElement.children[indexLastElement - 1].classList.add( CSS_CLASS_OPTION['last-interactive-dot'] );
                break;
            }

            arrInteractiveDots.push(index);
        }

        // присваивание интерактивных классов
        for (let i = arrInteractiveDots.length; --i > -1; ) {
            const index = arrInteractiveDots[i] - 1;

            this._cloneTrackElement.children[index].classList.add( CSS_CLASS_OPTION['interactive-dot'] );

        }

    }

    /**
     * @method checkOrderTrack
     * @description наблюдает за направлением дорожки
     */
    checkOrderTrack () {
        this._order = !this._order;

        if (this._order) {
            this.createInteractiveDots(this.quantityVisibleImage);
        } else {
            this.createInteractiveDots(this._quantityImageRetention + 1);
        }
    }

    /**
     * @method countRetentionImage
     * @description подсчитывает остаток картинок в конце
     */
    countRetentionImage() {
        const index = arrInteractiveDots.length - 1;
        this._quantityImageRetention = this._quantityAllImage - arrInteractiveDots[index];
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
    
    /**
     * @method removeCSSClassSelectedElements
     * @description метод очистки выбранных css-классов
     */
    removeCSSClassSelectedElements (sel) {
        const arrActiveElements = GALLERY_ACTIVE_ZONE.querySelectorAll(`.${sel}`);
        
        [ ...arrActiveElements ].forEach( (element) => element.classList.remove(sel) )
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
            wrapper.classList.add( CSS_CLASS_OPTION['loaded-track-image'] );
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
        this._quantityAllImage = 0;
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

        for (let i = 0; i < this._quantityAllImage; i++) {
            const classImage = new ImageDOMElement(this._arrTrackImg[i], CSS_CLASS_OPTION['default-wrapper-image'], CSS_CLASS_OPTION['default-track-image'], i );

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
                    this._quantityAllImage = this._arrGalleryImg.length;
            
                    this._addImageTracking();

                    return data;
                })
                .then( data => {
                    const arr = this.createTemplateImage();

                    for (let i = 0; i < this._quantityAllImage; i++) {
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
        return this.loadedImage()
            .then( (data) => {
                // обработчик клика по картинке на дорожке
                this._cloneTrackElement.addEventListener('click', this._clickTrackHandler);
                GALLERY_ACTIVE_ZONE.addEventListener('click', this._clickButtonArrow);
                GALLERY_FULL_IMAGE_WRAPPER.addEventListener('click', this._clickFullImageHandler);
                

                return data;
            })
            .then( (data) => {
                this.addedVisibleImage();
                this.appendTrackNodes();
                this.activateSelectedImage(dataPosition);
                this.createInteractiveDots();
                this.countRetentionImage();
                this.addEndNumberPagination(this._quantityAllImage);

                return data;
            })
    }
}

// времянка
let minsk = new Slider('minsk', '_thumbnail_retina');
minsk.projectAssembly()