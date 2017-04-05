window.onload=function(){
  hasProcessedImages = []
  cachedImages = []
  currentImageIndex = 0;
  loandingimg1 = true;
  loandingimg2 = true;

  ownMap = [ 'our', 'other' ] //0 is our 1 is other

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
  function showNextImg(imageURLs, forms) {
      forms.forEach(function(form, index) {
        curimg = form.querySelector('.curimg');
        wordspan = form.querySelector('.word');
        curimg.onload = (function(index){
          if(!loandingimg1 && !loandingimg2) return;
          return function(event) {
            if(index == 0) { loandingimg1 = false;}
            if(index == 1) { loandingimg2 = false; }
            if(!loandingimg1 && !loandingimg2) {
              document.querySelector('.loading').classList.remove('show');
              document.querySelector('.container').classList.remove('hide');
            }
          }
        })(index);

        var imgURL = imageURLs[ownMap[index]]['image'] ? ['static', 'BoxImags', imageURLs[ownMap[index]]['image'] ].join('/') : '';
        
        if(!imgURL) {
            form.style.visibility = 'hidden';
        }else{
            curimg.src = ['static', 'BoxImags', imageURLs[ownMap[index]]['image'] ].join('/');
            wordspan.innerHTML = imageURLs[ownMap[index]]['word'];
            form.style.visibility ='visible';
        }
        console.log(curimg.src);
      })
  }
  function initformEvent(form) {
    var notice = form.querySelector('.notice');
    console.log(form);
    //hide  enterRightWordBox
    enterRightWordBox = form.querySelector('.enter-right-word');
    // enterRightWordBox.style.display ='none';

    form.elements['right_word'].onfocus = function(event) {
      notice.classList.add('hide');
    }
    radiosDom = getRadios(form);
    var isBox = true, isWord = true;
    radiosDom.forEach(function(radio){
        radio.onclick= (function(enterRightWordBox){
          return  function(event){
            var _ = this;
            if(_.checked && _.value == 'no') {
              switch (_.name) {
                case 'isrightbox':
                  isBox = false;
                  break;
                case 'isrightword':
                  isWord = false;
                  break;
              }
              console.log('change ' + isBox+' '+isWord);
            }
            if(_.checked && _.value == 'yes') {
              switch (_.name) {
                case 'isrightbox':
                  isBox = true;
                  console.log('isrightbox');
                  break;
                case 'isrightword':
                  isWord = true;
                  console.log('isrightword');
                  break;
              }
              console.log('change yes : ' + isBox + ' '+isWord);
            }
            if(isBox && isWord) {
                enterRightWordBox.style.visibility="hidden";
                //hide notice
                notice.classList.add('hide');
            }else{
                enterRightWordBox.style.visibility="visible";
            }
          };
        })(enterRightWordBox);
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
        if(_.checked && _.value == 'yes') {
          switch (_.name) {
            case 'isrightbox':
              isBox = true;
              break;
            case 'isrightword':
            isWord = true;
            break;
          }
        }
        if(_.checked && _.value == 'no') {
          switch (_.name) {
            case 'isrightbox':
              isBox = false;
              break;
            case 'isrightword':
            isWord = false;
            break;
          }
        }
      })
      var box_flag = isBox ? true : false;
      var word_flag = isWord ? true : false;
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

  xhr.onreadystatechange = function() {
    var formdata;
    if(xhr.readyState == 4) {
      if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 ) {
        data = JSON.parse(xhr.response);
        cachedImages = data['images'];
        console.log(cachedImages);

        forms = [].slice.call(document.forms);
        forms.forEach(function(form, index) {
            showNextImg(cachedImages[currentImageIndex], forms);
            initformEvent(form);
        })
        submitBtn = document.querySelector('#submit');
        submitBtn.onclick = function(event) {
            var _ = this;
            event.preventDefault();
            validateForm(forms, function(validateSuccess, formdata){
              if(validateSuccess) {
                storageToDB(formdata, function(){
                    hasProcessedImages.push(currentImageIndex);
                    currentImageIndex += 1;
                    showNextImg(cachedImages[currentImageIndex], forms);
                    forms[0].reset();
                    forms[0].querySelector('.enter-right-word').style.display='none';
                    forms[1].reset();
                    forms[1].querySelector('.enter-right-word').style.display='none';

                });
              }
            });
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
