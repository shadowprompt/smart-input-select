import React from 'react';
import { useDispatch } from "./main";

/**
 * 根据指定count使用sis组件
 * @param count
 * @param valueArr
 * @returns {[unknown[], setState]}
 */
export function useSis(count, valueArr) {
 const [state, dispatch] = useDispatch(Array(count).fill(1).reduce((acc, curr, index) => ({
   ...acc,
   [index]: valueArr[index] || [],
 }), {}));

 function setState(index, value) {
   dispatch(index, value);
 }

 return [Object.values(state), setState];
}
