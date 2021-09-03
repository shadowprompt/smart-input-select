import React, { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDispatch } from "../../utils/Hooks/main";

function defaultCallShowText({label, value}) {
  return label ? `${label}<${value}>` : value;
}

const AssociateBox = (props, ref) => {
  const {
    list = [],
    show,
    callShowText = defaultCallShowText,
  } = props;

  const [state, dispatch] = useDispatch({
    focusIndex: 0,
  });

  const containerRef = useRef(null);
  const itemMapRef = useRef({});

  function onMouseEnter(index) {
    updateFocusIndex(index);
  }

  function onClick(value) {
    // this.$emit('select', value);
    props.onSelect(value);
  }

  function showText(data) {
    return callShowText(data);
  }

  function updateFocusIndex(index) {
    dispatch({
      focusIndex: index,
    });
  }
  function updateFocus(payload) {
    const length = list.length;
    let focusIndex = state.focusIndex;
    if (payload + focusIndex > length - 1) {
      focusIndex = length - 1;
    } else if(payload + state.focusIndex < 0) {
      focusIndex = 0;
    } else {
      focusIndex = state.focusIndex + payload;
    }
    updateFocusIndex(focusIndex);

    const ref = itemMapRef.current[state.focusIndex];
    if (ref) {
      const { scrollTop } = ref.parentNode;
      const offsetHeight = state.focusIndex * liHeight;
      if (state.focusIndex > displayCount && offsetHeight >= scrollTop) { // 此时焦点应该永远在最底部
        ref.parentNode.scrollTop = scrollTop + liHeight;
      }else if (offsetHeight < scrollTop ) { // 此时焦点应该永远在顶部
        ref.scrollIntoView();
      }
    }
  }

  function resetFocus() {
    dispatch({
      focusIndex: 0,
    });
    containerRef.current.scrollTop = 0; // 滚动到顶部
  }

  function getFocusResult() { // 返回当前候选词信息
    return list[state.focusIndex];
  }

  const hasOrganizationInfo = useMemo(() => {
    return list.some(item => item.organization);
  }, [list]);

  const liHeight = useMemo(() => { // 候选词是否含有组织信息li标签的高度不一样
    return hasOrganizationInfo ? 56 : 36;
  }, [hasOrganizationInfo]);

  const displayCount = useMemo(() => { // 180/36 = 5
    return Math.floor(180/liHeight) - 1; // 减1效果更佳
  }, [liHeight]);

  useImperativeHandle(ref, () => ({
    updateFocus,
    resetFocus,
    getFocusResult,
  }));

  return (
    <ul className='email-address-group'
        ref={containerRef}
        style={{ display: show ? '' : 'none', maxHeight: '180px', top: '100%', overflowY: 'auto', zIndex: 3}}>
      {
        list.map((item, index) => (
          <li
            key={item.emailAddress}
            ref={ref => itemMapRef.current[index] = ref}
            className={state.focusIndex === index ? 'tabselect' : ''}
            onMouseEnter={() => onMouseEnter(index)}
            onClick={() => onClick(item)}>{showText(item)}<p>{item.organization || ''}</p></li>
        ))
      }
    </ul>
  );
};

export default React.memo(forwardRef(AssociateBox));
