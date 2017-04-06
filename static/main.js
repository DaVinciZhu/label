window.onload=function(){
    var cachedImages = [],
        currentImageIndex = 0,
        loadingming1 = true,
        loadingming2 = true;

    var ownMap = [ 'our', 'other' ] //0 is our 1 is other
    var isOurBoxRight = true, isOurWordRight = true, isOtherBoxRight = true, isOtherWordRight = true;

    forms = [].slice.call(document.forms);

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
                document.querySelector('.loading').classList.remove('show');
                document.querySelector('.container').classList.remove('hide');
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
                    _imgBoxHeight = Math.max(_imgBoxHeight, _.height);

                    forms[index].querySelector('.img-box').style.height = _imgBoxHeight + 'px';
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
                    document.querySelector('.loading').classList.remove('show');
                    document.querySelector('.container').classList.remove('hide');
                }
            }else{
                curimg.removeAttribute('width');
                curimg.removeAttribute('height');

                curimg.src = imgURL;
                console.log(`the ${index} img url is ${imgURL}.`);
                wordspan.innerHTML = imageURLs[ownMap[index]]['word'];
                rightwordinput.value = imageURLs[ownMap[index]]['word']; //set word text default value
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
                            forms[0].elements['right_word'].value = '';
                            forms[1].elements['right_word'].value = '';
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

    function createXHR() {
        return new XMLHttpRequest();
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
        // console.log(cachedImages);
        // if length is 0 , All the pictures have been processed
        if(cachedImages.length == 0){
            loadingming1 = loadingming2 = false;
            document.querySelector('.loading').classList.remove('show');
            document.querySelector('.success-msg').classList.remove('hide');
            return;
        }
        forms.forEach(function(form, index) {
            showNextImg(cachedImages[currentImageIndex], forms);
            initformEvent(form, index);
        })
        var goNextBtn = document.querySelector('#goNext');
        var goLastBtn = document.querySelector('#goLast');
        [goNextBtn, goLastBtn].forEach(function(submitBtn, index) {
            submitBtn.onclick = function(event) {
                var _ = this;
                console.log(_);
                console.log('hahahahahah');
                event.preventDefault();
                // validateForm validate forms and the argument is a callback will be called if validate success
                validateForm(forms, function(validateSuccess, formdata){
                  if(validateSuccess) {
                    storageToDB(formdata, function(){
                        if(_ == goNextBtn) {
                            currentImageIndex += 1;
                            console.log('currImgIndex is: ' + currentImageIndex + 'cachedImagesLength is: ' + cachedImages.length);
                            if(currentImageIndex >= cachedImages.length) {
                                loadingming1 = loadingming2 = false;
                                document.querySelector('.loading').classList.remove('show');
                                document.querySelector('.container').classList.add('hide');
                                document.querySelector('.success-msg').classList.remove('hide');
                                window.location.reload();
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
          xhr = createXHR();
          xhr.onreadystatechange = function(){
            if(xhr.readyState == 4) {
              if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 ) {
                  msg = JSON.parse(xhr.responseText).msg;
                  if(msg.trim() == 'ok') {
                      //call callback
                      func();
                  }else {
                    console.log('error for storage:' + msg);
                  }
              } else {
                  console.log('request was unsuccessful: ' + xhr.status);
              }
            }
          };
          xhr.open('post', '/storagedb', true);
          console.log('data for update to db:');
          console.log(formdata);
          // xhr.send(JSON.stringify(formdata));
          // xhr.setRequestHeader("Content-Type", "application/json");
          // xhr.send(JSON.parse(JSON.stringify(formdata)));
          xhr.send(JSON.stringify(formdata));
        }

      } else {
          console.log('request was unsuccessful: ' + xhr.status);
      }
    }
    };
    xhr.open('post', '/images', true);
    xhr.send(null);
}
