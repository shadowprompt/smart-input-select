import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from 'react';
import { throttle } from '../../utils/index';

const SmartInputSelectInput = (props, ref) => {
  const { inputIndex, isShow, maxWidth, ignoreBlur } = props;

  const [inputValue, setInputValue] = useState(''); // 当前编辑框关联的list中的index
  const [inputWidth, setInputWidth] = useState(4); // 输入内容的宽度
  const inputContainerRef = useRef(null);
  const inputRef = useRef(null);

  function generateText(text) {
    const rawText = text.replace(/(↵|\s)/g, '');
    const arr = rawText.match(/([^<]+)<([^>]+)/) || [];
    let label, value;
    if (arr.length === 3) {
      const tempLabel = RegExp.$1 || '';
      const tempValue = RegExp.$2 || '';
      label = tempLabel.trim();
      value = tempValue.trim();
    }else {
      label = '';
      value = rawText;
    }
    return {
      label,
      value,
    }
  }
  function calWidth(value, fontSize = '14px') {
    let div = document.createElement('div');
    div.innerText = value;
    div.class= 'class' + Date.now();
    div.style.fontSize = fontSize;
    div.style.width = 'auto';
    div.style.display = 'inline-block';
    div.style.visibility = 'hidden';
    div.style.position = 'fixed';
    div.style.overflow = 'auto';
    document.body.append(div);
    let width = div.clientWidth;
    div.remove();
    return window.parseInt(width) + 4;
  }
  // 返回当前输入信息
  function getInputValue() {
    return inputValue;
  }
  // 更新当前输入信息
  function updateInputValue(value) {
    setInputValue(value);
  }

  useImperativeHandle(ref, () => ({
    focus,
    node: inputContainerRef.current,
    updateInputValue,
    getInputValue,
  }));
  // 执行聚焦
  function focus(delay = 200) {
    // 确保input显示后再
    setTimeout(() => {
      inputRef.current.focus();
    }, delay);
  }

  // 判断是否运行插入新值
  function shouldInsert(text) {
    return text;
    // if (!text) {
    //   return false;
    // }
    // const target = generateText(text);
    // return !list.some(item => item.label === target.label && item.value === target.value);
  }

  // 节流后通知输入变化
  const throttledChange = throttle(props.onChange, 100);

  async function onInputChange(e) {
    const value = (e.target.value || '').trim();
    setInputValue(value);
    console.log('sis onInputChange -> ', value);
    throttledChange(value);
  }
  // 按键按下
  function onInputKeyDown(e) {
    if(e.keyCode === 38) { // 上移
      // 避免上移时，光标跑到文字最前面
      e.preventDefault();
    }
  }
  // 按键抬起
  function onInputKeyUp(e) {
    const { keyCode } = e;
    if(keyCode === 38) { // 上移
      // 避免上移时，光标跑到文字最前面
      e.preventDefault();
      props.onMoveFocus(-1);
    }else if (keyCode === 40) { // 下移
      props.onMoveFocus(1);
    }else if (keyCode === 13) { // 回车上屏
      e.stopPropagation();
      props.onEnterInsert(generateText(inputValue));
      updateInputValue('');
    } else if (keyCode === 8 && inputValue.length === 0) { // Backspace删除空
      console.log('sis Backspace -> ', inputValue, e.target.value);
      props.onInputBackspace();
    }  else if (keyCode === 46 && inputValue.length === 0) { // Delete删除空
      console.log('sis Delete -> ', inputValue, e.target.value);
      props.onInputDelete();
    }
  }
  function onInputClick(e) {
    // e.stopPropagation();
    console.log('sis onInputClick -> ', e.target);
  }

  function onInputFocus() {
    console.log('sis onInputFocus -> ', inputValue);
    props.onInputFocus(inputValue, generateText(inputValue));
  }

  function onInputBlur() {
    setTimeout(() => {
      console.log('sis ignoreBlur -> ',ignoreBlur);
      props.onInputBlur(inputValue, generateText(inputValue)); // 外层需过滤空值情况
      if (shouldInsert(inputValue)) {
        updateInputValue('');
      }
    }, 200);
  }

  useEffect(() => {
    const width = calWidth(inputValue);
    setInputWidth(Math.max(width, 4));
  }, [inputValue]);

  return (
    <li className="drop-tag-li draw-item"
        style={{display: isShow ? '' : 'none', position: 'relative', height: '30px', float: 'left', width: inputWidth + 4 + 'px', maxWidth: maxWidth}}
        ref={inputContainerRef}>
      <input type='text' className='address-box-item drop-tag'
             style={{overflow: 'hidden', outline: 'none', border: 'none', color: 'initial', backgroundColor: 'initial', boxShadow: 'none', marginLeft: '4px', paddingLeft: 0, paddingRight: 0, height: '20px'}}
             ref={inputRef} value={inputValue}
             onChange={onInputChange} onKeyDown={onInputKeyDown} onKeyUp={onInputKeyUp}
             onClick={onInputClick} onFocus={onInputFocus} onBlur={onInputBlur}
      />
    </li>
  );
};

export default React.memo(forwardRef(SmartInputSelectInput));
