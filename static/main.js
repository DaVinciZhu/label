window.onload=function(){
    var cachedImages = [],
        currentImageIndex = 0,

        loadingming1 = true,
        loadingming2 = true;

    var ownMap = [ 'our', 'other' ] //0 is our 1 is other
    var isOurBoxRight = true, isOurWordRight = true, isOtherBoxRight = true, isOtherWordRight = true;
    var forms = [].slice.call(document.forms);
    var ourEnterWordBox = forms[0].querySelector('.enter-right-word');
    var otherEnterWordBox = forms[1].querySelector('.enter-right-word');

    var hasAllLabled = false;

    function createXHR() {
        return new XMLHttpRequest();
    }
    window.onbeforeunload = function(){
        var update_status_xhr = createXHR();
        update_status_xhr.onreadystatechange = function(){
            if(update_status_xhr.readyState == 4) {
                 if(update_status_xhr.status >= 200 && update_status_xhr.status < 300 || update_status_xhr.status == 304 ) {
                    data = JSON.parse(update_status_xhr.response || update_status_xhr.responseText)
                    if(data.msg == 'ok') {
                        console.log('processing status update success')
                    }else{
                         if(parseInt(data.code) == 1) {
                             window.location.reload();
                         }
                        console.log(`update processing status error ${data.msg}`)
                    }
                 }
            }
        }
        update_status_xhr.onerror = function(){
            console.log('update processing status error...')
        }
        update_status_xhr.open('post', '/updateprostatus', false);
        update_status_xhr.send(JSON.stringify({ 'images': cachedImages }));
    }
    function getRadios(form) {
        var inputs = form.querySelectorAll('input');
        radiosDom = [];
        for(var i =0 ;i < inputs.length; i++){
            if(inputs[i].type == 'radio') {
                radiosDom.push(inputs[i]);
            }
        }
        return radiosDom;
    }
    function setPercentBar(percent){
        var process = document.querySelector('.process-status');
        var processText = document.querySelector('.process-text');

        process.style.width = '100%';
        processText.innerText = percent;
    }
    function resetForm() { //reset form field
        isOurBoxRight    = true;
        isOurWordRight   = true;
        isOtherBoxRight  = true;
        isOtherWordRight = true;

        forms[0].reset();
        forms[1].reset();

        forms[0].querySelector('.enter-right-word').style.visibility='hidden';
        forms[1].querySelector('.enter-right-word').style.visibility='hidden';
    }
    function showForm(){
        if(!loadingming1 && !loadingming2) {
            setPercentBar('100%');
            setTimeout(function(){
                isLoading(false);
            }, 100);

        }
    }
    function isBoxRight(index){
        if(index == 0) return !!isOurBoxRight;
        if(index == 1) return !!isOtherBoxRight;

        return isOurBoxRight && isOtherBoxRight;
    }
    function isWordRight(index){
        if(index ==0) return !!isOurWordRight;
        if(index ==1) return !!isOtherWordRight;

        return isOurWordRight && isOtherWordRight;
    }
    function isLoading(flag) {
        if(flag) {
            loadingming1 = loadingming2 = true;
            document.querySelector('.loading').classList.add('show');
            document.querySelector('.container').classList.add('hide');
        } else{
            loadingming1 = loadingming2 = false;
            document.querySelector('.loading').classList.remove('show');
            document.querySelector('.container').classList.remove('hide');
        }
    }
    function showAllWordIsLabeled() {
        loadingming1 = loadingming2 = false;
        isLoading(false);
        document.querySelector('.success-msg').classList.remove('hide');
        document.querySelector('.container').classList.add('hide');
        return;
    }
    function updateBoxandWordFlag(index){
        var _ =this;
        if(_.nodeType == 1 && _.type =='radio') {
            if(_.checked && _.value == 'no') {
                switch (_.name) {
                    case 'isrightbox':
                        if(index == 0){
                            isOurBoxRight = false;
                        } else {
                            isOtherBoxRight = false;
                        }
                        break;
                    case 'isrightword':
                        if(index == 0){
                            isOurWordRight = false;
                        } else {
                            isOtherWordRight = false;
                        }
                        break;
                }
            }
            if(_.checked && _.value == 'yes') {
                switch (_.name) {
                    case 'isrightbox':
                        if(index == 0){
                            isOurBoxRight = true;
                        } else{
                            isOtherBoxRight = true;
                        }
                        break;
                    case 'isrightword':
                        if(index == 0){
                            isOurWordRight = true;
                        } else{
                            isOtherWordRight = true;
                        }
                        break;
                }
            }
        }
    }
    function showNextImg(imageURLs, forms) {
        var _imgBoxHeight = 65;
        forms.forEach(function(form, index) {
            curimg = form.querySelector('.curimg');
            wordspan = form.querySelector('.word');
            rightwordinput = form.elements['right_word'];

            wordspan.innerHTML = imageURLs[ownMap[index]]['word'];
            rightwordinput.value = imageURLs[ownMap[index]]['word']; //set word text default value

            curimg.onload = (function(index){
                return function(event) {
                    var _ = this;
                    if(index == 0) { loadingming1 = false;}
                    if(index == 1) { loadingming2 = false; }

                    //if img width greater than 410px then set it width 410px;
                    var curImgWidth = _.width;
                    var curImgHeight = _.height;
                    console.log(`the ${index} img's raw width is ${curImgWidth}`);
                    if(parseInt(curImgWidth) > 410) {
                        console.log('greater than 410');
                        var radio = curImgWidth / curImgHeight;
                        _.width = 410;
                        _.height = _.width / radio;
                    } else{
                        _.width = curImgWidth;
                        _.height = curImgHeight;
                    }
                    console.log(`the ${index} img's real width in html is ${_.width}`);
                    console.log(`the ${index} img's real height in html is ${_.height}`);
                    _imgBoxHeight = Math.max(_imgBoxHeight, _.height);
                    forms[0].querySelector('.img-box').style.height = _imgBoxHeight + 'px';
                    forms[1].querySelector('.img-box').style.height = _imgBoxHeight + 'px';
                    showForm();
                }
            })(index);
            curimg.onerror=function(e){
                loadingming1 = false;
                loadingming2 = false;
                showForm();
            }
            console.log('show next img...');
            var imgURL = imageURLs[ownMap[index]]['image'] ? ['static', 'BoxImags', imageURLs[ownMap[index]]['image'] ].join('/') : '';

            if(!imgURL) {
                console.log(`the ${index} img is null`);
                // if img is none then first we hidden form for show it and then set loading variable is false
                form.style.visibility = 'hidden';

                if(index == 0) loadingming1 = false;
                if(index == 1) loadingming2 = false;
                console.log(loadingming1 + ' ' + loadingming2);
                if(!loadingming1 && !loadingming2) {
                    isLoading(false);
                }
            }else{
                curimg.removeAttribute('width');
                curimg.removeAttribute('height');

                curimg.src = imgURL;
                console.log(`the ${index} img url is ${imgURL}.`);
                form.style.visibility ='visible';
            }
        })
    }
    function initformEvent(form, index) {
        var notice = form.querySelector('.notice');
        //hide  enterRightWordBox
        var enterRightWordBox = form.querySelector('.enter-right-word');
        var enterRightWordInput = enterRightWordBox.querySelector('input');

        // enterRightWordBox.style.display ='none';
        enterRightWordInput.onkeydown = function(event) {
            if(parseInt(event.keyCode) == 13) {
                return false;
            }
        }
        enterRightWordInput.onkeyup = (function(index) {
            var otherEnterRightBox = forms[index == 0 ? 1 : 0].querySelector('.enter-right-word');
            var otherEnterRightInput = otherEnterRightBox.querySelector('input');
            return function(event){
                _ = this;
                console.log(_.value);
                if(otherEnterRightBox.style.visibility != 'hidden') {
                    otherEnterRightInput.value = _.value;
                }
            }
        })(index);
        form.elements['right_word'].onfocus = function(event) {
            notice.classList.add('hide');
        }

        radiosDom = getRadios(form);
        radiosDom.forEach(function(radio){
            radio.onclick= (function(enterRightWordBox, index){
                return  function(event){
                    var _ = this;
                    console.log('index == ' + index);
                    updateBoxandWordFlag.call(_, index); //update radio flag

                    var isBox = true, isWord = true;
                    if(index == 0){
                        isBox = isOurBoxRight;
                        isWord = isOurWordRight;
                    } else{
                        isBox = isOtherBoxRight;
                        isWord = isOtherWordRight;
                    }
                    if(isBox && isWord) {
                        enterRightWordBox.style.visibility="hidden";
                        //hide notice
                        notice.classList.add('hide');
                    }else{
                        console.log('show box for enter right word');
                        //set default value is other form's word if it is right
                        // console.log(isOtherBoxRight + ' other ' + isOtherWordRight);
                        // console.log(isOurBoxRight + ' our ' + isOurWordRight);
                        if((index == 0 && (isOtherWordRight && isOtherBoxRight)) || (index == 1 && (isOurBoxRight && isOurWordRight))) {
                            var otherFormIndex = index == 0 ? 1 : 0;
                            form.elements['right_word'].value = forms[otherFormIndex].querySelector('.word').innerText;
                        }
                        if(!((isOurWordRight && isOurBoxRight) || (isOtherWordRight && isOtherBoxRight))) {

                            if(index == 0 && otherEnterWordBox.visibility != 'hidden'){
                                if(forms[1].elements['right_word'].value.trim() != forms[0].querySelector('.word').innerText.trim()){
                                    forms[0].elements['right_word'].value = forms[1].elements['right_word'].value;
                                } else {
                                    forms[0].elements['right_word'].value = forms[1].elements['right_word'].value = '';
                                }

                            }
                            if(index == 1 && ourEnterWordBox.visibility != 'hidden'){
                                if(forms[0].elements['right_word'].value.trim() != forms[1].querySelector('.word').innerText.trim()){
                                    forms[1].elements['right_word'].value = forms[0].elements['right_word'].value;
                                } else {
                                    forms[0].elements['right_word'].value = forms[1].elements['right_word'].value = '';
                                }
                            }
                            forms[0].elements['right_word'].focus();
                        }
                        enterRightWordBox.style.visibility="visible";
                        enterRightWordBox.querySelector('input').focus();
                    }
                };
            })(enterRightWordBox, index);
        });
    }

    function validateForm(forms, func){
        var data = {'our': {}, 'other': {}};
        var validate = true;
        forms.forEach(function(form, index) {
            if(hasAllLabled) return;

            if(!validate) {
                return;
            }
            var notice = form.querySelector('.notice');
            var prefix = index == 0 ? 'our' : 'other';
            var isBox = true, isWord = true, right_word;

            var radiosDom = getRadios(form);
            radiosDom.forEach(function(radio){
                var _ = radio;
                updateBoxandWordFlag.call(_, index);
            })
            var box_flag =  isBoxRight(index) ? true : false;
            var word_flag =  isWordRight(index) ? true : false;
            right_word = form.elements['right_word'].value;

            if((box_flag && word_flag) || right_word.trim() != "") {
                notice.classList.add('hide');
                var id = cachedImages[currentImageIndex][ownMap[index]]['id']
                data[prefix] = {
                    'box_flag': box_flag,
                    'word_flag': word_flag,
                    'right_word': right_word,
                    'id': id
                }
                validate = true;
            } else {
                notice.classList.remove('hide');
                validate =false; //flase stand for validate failed
                return;
            }
        })
        if(validate) {
            func(true, data);
        } else {
            func(false);
        };
  }
    xhr = createXHR();

    xhr.onprogress = function(event) {
        var process = document.querySelector('.process-status');
        var received = event.position || event.loaded;
        var total = event.totalSize || event.total;
        console.log('received ' + received + ' total: ' + total);
        if(event.lengthComputable) {
            percent = parseInt(received) / parseInt(total)*100 + '%';
            setPercentBar(percent);
        } else {
            process.parentNode.style.display = 'none';
            document.querySelector('.process-text').innerText = '';
        }
    }
    xhr.onload = function(event) {
        var process = document.querySelector('.process-status');
        var processText = document.querySelector('.process-text');
        processText.innerText = '100%';
    }
    xhr.onreadystatechange = function() {
    var formdata;
    if(xhr.readyState == 4) {
      if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 ) {
        data = JSON.parse(xhr.response);
        cachedImages = data['images'];
        console.log(cachedImages);

        // if length is 0 , All the pictures have been processed
        if(cachedImages.length == 0){
            hasAllLabled = true;
            showAllWordIsLabeled();
            return;
        }
        showNextImg(cachedImages[currentImageIndex], forms);

        forms.forEach(function(form, index) {
            initformEvent(form, index);
        })
        var goNextBtn = document.querySelector('#goNext');
        var goLastBtn = document.querySelector('#goLast');
        [goNextBtn, goLastBtn].forEach(function(submitBtn, index) {
            submitBtn.onclick = function(event) {
                var _ = this;
                event.preventDefault();
                if(hasAllLabled || (loadingming1 == true || loadingming2 == true)) return; // if all words are labeled then exit immediately
                // validateForm validate forms and the argument is a callback will be called if validate success
                validateForm(forms, function(validateSuccess, formdata){
                  if(validateSuccess) {
                    storageToDB(formdata, function() {
                        // console.log(`%c two_labeled : ${two_labeled}`, "color: blue; font-size: 18px;");
                        // if(two_labeled) {
                        //     cachedImages.splice(currentImageIndex, 1);
                        // }
                        if(_ == goNextBtn) {

                            // if(!two_labeled) {
                                currentImageIndex += 1;
                            // }
                            console.log('currImgIndex is: ' + currentImageIndex + 'cachedImagesLength is: ' + cachedImages.length);
                            if(currentImageIndex >= cachedImages.length) {
                                cachedImages =  [];
                                currentImageIndex = 0;
                                console.log(`%c get new images `, "color:green; font-size: 18px;");
                                xhr.open('post', '/images', true);
                                xhr.send(null);
                                isLoading(true);
                                return;
                            }
                        }　else {
                            currentImageIndex -= 1;
                            currentImageIndex = currentImageIndex < 0 ? 0: currentImageIndex;
                        }

                        showNextImg(cachedImages[currentImageIndex], forms);
                        resetForm();
                    });
                  }
                });
            };

        })
        // click enter trigger goNext btn
        document.onkeyup = function (event){
            event.preventDefault();
            event.stopPropagation();
            if (parseInt(event.keyCode)==13) {
                //回车键的键值为13
                goNextBtn.click();

                return false;
            }


    　　};
        function storageToDB(formdata, func) {
          if(typeof func != 'function') {
            throw new Error('argument must be a function');
          }
          var storage_xhr = createXHR();
          storage_xhr.onreadystatechange = function(){
            if(storage_xhr.readyState == 4) {
              if(storage_xhr.status >= 200 && storage_xhr.status < 300 || storage_xhr.status == 304 ) {
                  var data = JSON.parse(storage_xhr.response || storage_xhr.responseText);
                  console.log(data);
                  var msg = data.msg;
                //   var two_labeled = data.two_labeled;
                  if(msg.trim() == 'ok') {
                      //call callback
                      func();
                  }else {
                     if(parseInt(data.code) == 1) {
                         window.location.reload();
                     }
                    console.log(`%c error for storage: ${msg}`, "color: red");
                  }
              } else {
                  console.log(`%c request was unsuccessful: ${storage_xhr.status}`, "color: green");
              }
            }
          };
          storage_xhr.open('post', '/storagedb', true);
          console.log('data for update to db:');
          console.log(formdata);
          // xhr.send(JSON.stringify(formdata));
          // xhr.setRequestHeader("Content-Type", "application/json");
          // xhr.send(JSON.parse(JSON.stringify(formdata)));
          storage_xhr.send(JSON.stringify(formdata));
        }

        } else {
          console.log('request was unsuccessful: ' + xhr.status);
      }
    }
    };
    xhr.open('post', '/images', true);
    xhr.send(null);
    isLoading(true);
}
