import React, { useReducer, useState, useEffect, useMemo, useRef } from 'react';
import MailMessageCenter from '../MailMessageCenter';

const toString = Object.prototype.toString;

export function useDispatch (initialState) {
  const [state, dispatch] = useReducer((state, action) => {
    return {
      ...state,
      ...action,
    }
  }, initialState);

  const modifyStateWhileDispatch = (payload, value) => {
    if (toString.call(payload) !== '[object Object]') {
      payload = {
        [payload]: value,
      }
    }
    Object.assign(state, payload); // state changed(like vue) but dom not
    dispatch(payload); // dom changed with react
  };
  return [state, modifyStateWhileDispatch];
}

export function useSelect() {
  const [selectedMap, setSelectedMap] = useState({});

  function updateSelectedMap(id) {
    const map = Object.assign({}, selectedMap, {
      [id]: !selectedMap[id],
    });
    setSelectedMap(map);
  }

  function reset() {
    setSelectedMap({});
  }

  return [selectedMap, updateSelectedMap, reset];
}


export function useOutsideClick(ref, outsideCallback, insideCallback) {
  const [status, setStatus] = useState(false);
  function onOutsideClick(target) {
    if (ref && (!ref.current || !ref.current.contains(target))) {
      setStatus(false);
      typeof outsideCallback === 'function' && outsideCallback();
    } else {
      typeof insideCallback === 'function' && insideCallback();
    }
  }

  function toggleStatus(payload) {
    const newStatus = payload === void 0 ? !status : payload;
    setStatus(newStatus);
  }

  useEffect(() => {
    const onOutsideClickUuid = MailMessageCenter.subscribe('O-click', onOutsideClick);
    return () => {
      MailMessageCenter.removeListener('O-click', onOutsideClickUuid);
    }
  }, []);
  return [status, setStatus, toggleStatus];
}

export function useHover(ref, delay = 0, enterCallback, leaveCallback) {
  const [status, setStatus] = useState(false);
  const timerRef = useRef(null);

  const onMouseEnter = (e) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (typeof enterCallback === 'function') {
        enterCallback();
      } else {
        setStatus(true);
      }
    }, delay);
  };

  const onMouseLeave = (e) => {
    clearTimeout(timerRef.current);
    if (typeof leaveCallback === 'function') {
      leaveCallback();
    } else {
      setStatus(false);
    }
  };

  function toggleStatus(payload) {
    const newStatus = payload === void 0 ? !status : payload;
    setStatus(newStatus);
  }

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('mouseenter', onMouseEnter);
      ref.current.addEventListener('mouseleave', onMouseLeave);
    }
    return () => {
      if (ref.current) {
        ref.current.removeEventListener('mouseenter', onMouseEnter);
        ref.current.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);
  return [status, setStatus, toggleStatus];
}

/**
 * 用随机值作为key方便强制渲染
 * @param initialState
 * @returns {[unknown, updateState]}
 */
export function useRandomKey(initialState) {
  const [state, setState] = useState(initialState === void 0 ? Date.now() : initialState);
  function updateState(value) {
    setState(value);
  }
  return [state, updateState];
}

/**
 * 将state存入sessionStorage中
 * @param key
 * @returns {[unknown, updateState]}
 */
export function useSessionState(key) {
  const [state, setState] = useState(null);

  function updateState(value) {
    sessionStorage.setItem(key, value);
    setState(value);
  }

  useEffect(() => {
    const value = sessionStorage.getItem(key);
    try {
      setState(JSON.parse(value));
    } catch (e) {

    }
  }, []);

  return [state, updateState];
}

/**
 * 检测重复点击
 * @param wait
 * @returns {Function}
 */
export function useRepeatClick(wait = 2000) {
  const timeRef = useRef(0);

  return function () {
    const now = Date.now();
    if (now - timeRef.current > wait) {
      timeRef.current = now;
      return false;
    } else {
      return true;
    }
  }
}

