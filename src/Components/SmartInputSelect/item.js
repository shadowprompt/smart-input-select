import React, { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react';

const SmartInputSelectItem = (props) => {
  const { index, data, validateMethod, callShowText, selectedIndexList, uniqueKey, allowDrop, allowDrag } = props;
  const containerRef = useRef(null);

  function onDragEnter(e) {
    // 拖拽元素靠近时让前方出现“光标”效果
    if (allowDrop) {
      containerRef.current.classList.add('drag_over');
    }
  }

  function onDragLeave(e) {
    if (allowDrop) {
      containerRef.current.classList.remove('drag_over');
    }
  }

  function onDragStart(e) {
    e.dataTransfer.setData('IM+MailAddress', JSON.stringify({
      index: index,
      uniqueKey: uniqueKey,
      data: {
        ...data,
      }
    }));
  }

  function onKeyUp(e) {
    console.log('sis onKeyUp -> ', e.target);
    if ([8, 46].includes(e.keyCode)){ // 删除 8: Backspace 46: Delete
      props.onItemDelete(index);
    }
  }
  // 在档期位置前插入一条
  function onInsertClick(e, index) {
    props.onInsertClick(e, index);
  }

  function onSelectClick(e) {
    e.stopPropagation();
    props.onSelectClick(index);
  }

  function onDoubleClick(e) {
    props.onDoubleClick(e, index);
  }

  // 邮箱地址是否合法
  const isLegal = useMemo(() => {
    // return /^[A-Za-z0-9_.\-]+@[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)+$/.test(this.data.value);
    return validateMethod(data, index);
  }, [data, index, validateMethod]);
  // 是否选中当前元素
  const isSelected = useMemo(() => {
    return selectedIndexList.includes(index);
  }, [selectedIndexList, index]);

  // useEffect(() => {
  //   props.onSelectClick(index);
  // }, [selectedIndexList]);

  return (
    <li className="drop-tag-li" dataindex={index} style={{position: 'relative',height: '30px', float: 'left'}}
        key={data.value + '_' + index} ref={containerRef}
        onKeyUp={onKeyUp}
        onClick={(e) => onInsertClick(e, index)}>
      <div datavalue={data.value} tabIndex={index} outline="0" hidefocus="true"
           draggable={allowDrag} onDragEnter={onDragEnter} onDragStart={onDragStart} onDragLeave={onDragLeave}
           onClick={onSelectClick}
           onDoubleClick ={onDoubleClick}
           className={['address-box-item', 'drop-tag', isSelected ? 'select' : '', isLegal ? 'correct' : 'error'].join(' ')}
           style={{overflow: 'hidden', outline: 'none'}}>{callShowText(data)}
      </div>
    </li>
  );
};

export default SmartInputSelectItem;
