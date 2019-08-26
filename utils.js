const utils = (function() {

    return {

        xhrGet(url, errorMsg) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200 && xhr.status !== 304) {
                            reject(errorMsg);
                        }
                        resolve(xhr.responseText);
                    }
                };

                xhr.open('GET', url, true);
                xhr.send();
            });
        },

        showPopup($popup) {
            const $html = $('html');

            $popup.fadeIn(100, function() {
                $(this).addClass('popup_active');
                $(document).trigger('popup:show', $(this));
            });

            $html.addClass('js-lock');
        },
        hidePopup($popup) {
            const $html = $('html');

            $popup.fadeOut(100, function() {
                $(this).removeClass('popup_active');
                $(document).trigger('popup:hide', $(this));
            });

            $html.removeClass('js-lock');
        },

        createSpinner() {
            return `<div class="lds-ring">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>`;
        }
    };
})();
