import React, { useEffect, useLayoutEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import SmartInputSelectItem from "./item";
import SmartInputSelectInput from './input';
import AssociateBox from "./AssociateBox";
import MailMessageCenter from '../../utils/MailMessageCenter';

import {useDispatch, useOutsideClick} from "../../utils/Hooks/main";
import {uuid} from "../../utils/index";

function defaultValidateMethod() { // 控制校验判断
  return true;
}

function defaultCallShowInputText({label, value}) {
  return label
    ? `${label}<${value}>`
    : value
}

function defaultCallShowItemText(data) {
  return data.label || data.value;
}

function defaultLandingInterceptor(obj) {
  return obj;
}

function defaultCallAutoSelect() {
  return false;
}

const RENDER_DELAY = 0; // 列表render后续逻辑setTimeout的delay毫秒数
let inputProcessId = null; // 当前输入流程id

const SmartInputSelect = (props, ref) => {
  const propsRef = useRef(null);
  propsRef.current = props;
  const {
    list = [],
    limit = window.Infinity,
    validateMethod = defaultValidateMethod, // 校验方法
    callShowInputText = defaultCallShowInputText, // item数据转为输入态控制方法
    callShowItemText = defaultCallShowItemText, // item数据转为查看态控制方法
    callShowAssociateText, // 候选词列表数据显示逻辑
    fetchListMethod, // 获取associateBox列表数据
    landingInterceptor = defaultLandingInterceptor, //  拦截最终使用值
    beforeEditHook, // 编辑前hook 实际表现为input在focus后
    afterEditHook, // 编辑后hook
    callAutoSelect = defaultCallAutoSelect, // 判断是否需要自动选中
    autoSelectIndex = 0, // 自动选中的index
    autoSelectTriggerLength = 1, // 列表多少值时触发自动选中
    uniqueKey = 'sis', // 不同sis组件直接进行区分
    allowDrop = true,
    allowDrag = true,
    showErrorBox = false,
  } = propsRef.current;
  const containerRef = useRef(null);
  const mainContainerRef = useRef(null);
  const inputContainerRef = useRef(null);
  const associateContainerRef = useRef(null);
  const isMounted = useRef(false); // 是否已加载
  useOutsideClick(containerRef, () => {
    clearAddress();
    clearSelected();
  });


  const [state, dispatch] = useDispatch({
    inputIndex: list.length,  // input在list中指向的index
    maxWidth: '96%', // 每个元素的最大宽度
    ignoreBlur: false, // 是否忽略blur
    addressList: [], // 搜索联想列表
    errors: [], // 记录错误
    errorMap: {},
    showAddressListFlag: false, // 手动显示地址列表标志位
    selectedIndexList: [], // 当前选中元素的index
  });
  const stateRef = useRef(null);
  stateRef.current = state;

  const {maxWidth, showAddressListFlag} = state;
  // ignoreBlur不可直接解构，否则会存在修改的滞后性，据此的判断依据都会跟预期不一致了

  function isLastIndexOfList(currentIndex) {
    return list.length > 0 ? currentIndex === list.length : 0;
  }
  // 操作输入框聚焦
  function doInputFocus(delay) {
    inputContainerRef.current.focus(delay);
  }
  // 输入框输入
  async function onInputChange(value) {
    inputProcessId = Date.now(); // 记录当前的搜索
    const addressList = typeof fetchListMethod === 'function' ? await fetchListMethod(value) : [];
    dispatch({
      addressList: inputProcessId ? addressList : [], // 若当前搜索流程已经完结（已被用户选中候选词），后续接口数据再返回已无意义，直接置为空
      showAddressListFlag: true, // 输入时再次确认showAddressListFlag开启
      selectedIndexList: [], // 清空已选择的index信息
    });
    resetFocusIndex();
  }
  // 输入框上下控制当前选中候选词
  function onInputMoveFocus(index) {
    associateContainerRef.current.updateFocus(index);
  }
  // 重置候选词的聚焦条目信息
  function resetFocusIndex() {
    associateContainerRef.current.resetFocus();
  }
  // 能否新增数据
  function checkIsExceed(way) {
    const isExceed = list.length >= limit;
    if (isExceed) {
      console.log('sis exceed ', way, ' canceled');
    }
    return isExceed;
  }
  // 在列表中插入数据
  function insertData(data) {
    dispatch({
      showAddressListFlag: true, // 确保被之前input在blur之后关闭showAddressListFlag了会被再次开启， 因为之前input的blur当前input的focus之后
    });
    const dataList = data.map(item => ({
      ...item,
      _key: uuid(), // 方便作为key
    })).map(landingInterceptor);
    if (isLastIndexOfList(stateRef.current.inputIndex)) { // 增加新的
      list.push(...dataList);
    } else { // 双击后更新的
      list.splice(stateRef.current.inputIndex, 0, ...dataList);
    }
    props.onChange(list.slice());
    clearAddress();
  }
  // 在当前inputIndex插入数据后的处理流程
  function afterDataInserted(indexBeforeInsert, addCount) {
    typeof afterEditHook === 'function' && afterEditHook(indexBeforeInsert, list[indexBeforeInsert], list);
    // 确保数据变更+input显示后再处理
    setTimeout(() => { // 此时重新渲染后输入框已在最后面
      if (!isLastIndexOfList(indexBeforeInsert)) { // 只要不是在最后面插入的，都需要将列表render后的置于最后面的input移动至当前上次锚定节点的前面
        const targetNode = mainContainerRef.current.children[indexBeforeInsert + addCount]; // list里面已经新插入了一个，故原锚定节点的index+1
        mainContainerRef.current.insertBefore(inputContainerRef.current.node, targetNode);
        // dom调整后修正index和input的指向
        dispatch({
          inputIndex: indexBeforeInsert + addCount,
        });
      }
      doInputFocus(0);
    }, RENDER_DELAY);
  }

  // 删除数据
  function deleteData() {
    if (!isLastIndexOfList(state.inputIndex)) {
      list.splice(state.inputIndex, 1);
      props.onChange(list.slice());
    }
    afterDataDeleted(state.inputIndex);
    dispatch({
      selectedIndexList: [],
    });
  }
  // 在当前inputIndex插入数据后的处理流程
  function afterDataDeleted(indexBeforeDelete) {
    // 确保数据变更+input显示后再处理
    setTimeout(() => { // 此时重新渲染后输入框已在最后面
      if (!isLastIndexOfList(indexBeforeDelete)) { // 只用不是向最后插入的，都需要将列表render后的置于最后面的input移动至当前上次锚定节点的前面
        const targetNode = mainContainerRef.current.children[indexBeforeDelete]; // list里面已经新插入了一个，故原锚定节点的index+1
        mainContainerRef.current.insertBefore(inputContainerRef.current.node, targetNode);
        // dom调整后修正index和input的指向
        dispatch({
          inputIndex: indexBeforeDelete,
        });
      }
      doInputFocus(0);
    }, RENDER_DELAY);
  }
  // 点击选中item后删除
  function onItemDelete (index) {
    dispatch({
      inputIndex: index,
    });
    deleteData();
  }
  // Backspace键删除元素
  function onInputBackspace() {
    const prevItemIndex = state.inputIndex - 1;
    const targetDeleteIndex = prevItemIndex < 0 ? 0 : prevItemIndex;
    if (state.selectedIndexList.includes(targetDeleteIndex)) { // 如果之前已经删除选中过
      onItemDelete(targetDeleteIndex);
    } else {
      // 左边无元素可删时停止
      if (state.inputIndex !== 0) {
        onSelectClick(targetDeleteIndex)
      }
    }
  }
  // Delete键删除元素
  function onInputDelete() {
    const targetDeleteIndex = state.inputIndex;
    if (state.selectedIndexList.includes(targetDeleteIndex)) { // 如果之前已经删除选中过
      onItemDelete(targetDeleteIndex);
    } else {
      // 右边无元素可删时停止
      if (!isLastIndexOfList(targetDeleteIndex)) {
        onSelectClick(targetDeleteIndex)
      }
    }
  }

  // 点击外层容器，方便用户随便点击一下能自动点击到input上，出现聚焦
  function onOutClick(e) {

    if (checkIsExceed('onOutClick')) {
      return;
    }

    dispatch({
      inputIndex: list.length,
    });
    // e.target可能是1.containerRef这个ul 2.inputContainerRef或里面的input
    if (mainContainerRef.current === e.target) { // 筛选出上述场景1
      e.target.appendChild(inputContainerRef.current.node); // 插入（或移动）到最后
    }
    doInputFocus();
  }

  function onInsertClick(e, index) {
    // 判断下插入点击时当前是否已经正在输入了
    // 避免在输入时点击别处进行插入，导致blur时的输入数据插入了新点击的index处，而非原输入前index处
    if (inputContainerRef.current.getInputValue()) {
      return;
    }
    e.stopPropagation();
    dispatch({
      inputIndex: index,
    });
    mainContainerRef.current.insertBefore(inputContainerRef.current.node, e.target);
    doInputFocus();
  }

  function onInputFocus(text, data) {
    // 完成数据插入后重置ignoreBlur
    // setTimeout(() => {
      dispatch({
        ignoreBlur: false,
      });
    // })
    // 触发显示候选词
    dispatch({
      ignoreBlur: false, // 重置ignoreBlur
      showAddressListFlag: true, // 聚焦时就开启showAddressListFlag
    });
    typeof beforeEditHook === 'function' && beforeEditHook(state.inputIndex, data, list);
  }
  // 输入框自然blur
  function onInputBlur(text, data) {
    if (!text) {
      dispatch({
        showAddressListFlag: false, // 失焦时确保showAddressListFlag，连续删除等场景下会有'误伤'
      });
      return;
    }
    if (checkIsExceed('onInputBlur')) {
      return;
    }

    if (state.ignoreBlur) { // 如果为true则代表别处已经有具体逻辑，此处无需处理，此时重置即可
      return dispatch({
        ignoreBlur: false,
      });
    }
    insertData([data]);
    afterDataBlurred();
  }
  // 插入数据流程
  function insertDataProcess(dataList) {
    insertData(dataList);
    afterDataInserted(stateRef.current.inputIndex, dataList.length);
  }

  function afterDataBlurred() {
    typeof afterEditHook === 'function' && afterEditHook(state.inputIndex, list[state.inputIndex], list);
    dispatch({
      showAddressListFlag: false, // 确保insertData中开启的showAddressListFlag被关闭
    });
  }

  // 回车上屏插入数据
  function onInputEnterInsert(data) {
    if (checkIsExceed('onInputEnterInsert')) {
      return;
    }
    dispatch({
      ignoreBlur: true,
    });
    const result = getAutoCompleteResult();
    const finalData = result.value
      ? result
      : data.value
        ? data
        : null; // 最终值顺序 1.候选信息 2.输入信息 3.空
    if (finalData) { // 只有value存在值的才算有效数据
      insertDataProcess([finalData]);
    }
  }

  // 获取选中的候选词信息
  function getAutoCompleteResult() {
    const {label, value} = associateContainerRef.current.getFocusResult() || {};
    return {
      label,
      value,
    };
  }
  // 尝试自动选中
  async function tryAutoSelect() {
    if (checkIsExceed('tryAutoSelect')){
      return;
    }
    await showAddress('');
    if (state.addressList.length > 0 && [state.addressList.length, 0].includes(autoSelectTriggerLength)) {
      associateContainerRef.current.updateFocus(autoSelectIndex);
      onInputEnterInsert({});
    }
  }

  async function showAddress(text) { // 展示地址列表,目前父组件也在使用
    const addressList = typeof fetchListMethod === 'function' ? await fetchListMethod(text) : [];
    dispatch({
      addressList
    });
  }
  // 清空候选词
  function clearAddress() {
    inputProcessId = null;
    dispatch({
      addressList: [],
    });
  }
  // 标记选中态
  function onSelectClick(selectedIndex) {
    dispatch({
      selectedIndexList: [selectedIndex]
    });
  }

  function clearSelected() {
    dispatch({
      selectedIndexList: [],
    });
  }

  function onDoubleClick (e, index) {
    e.stopPropagation();
    // 找到父元素li操作
    mainContainerRef.current.insertBefore(inputContainerRef.current.node, e.target.parentNode);
    // 更新input和index关联关系
    dispatch({
      inputIndex: index,
      selectedIndexList: [], // 移除因双击造成的点击选中效果
    });
    // 在列表中删除原值
    const data = list[index];
    list.splice(index, 1);
    props.onChange(list.slice());

    setTimeout(() => { // 此时重新渲染后输入框已在最后面
      const targetNode = mainContainerRef.current.children[index]; // list里面已经将待编辑的删掉了，故原锚定节点后面的节点变成锚点，新锚点的index仍为index
      mainContainerRef.current.insertBefore(inputContainerRef.current.node, targetNode);
      dispatch({
        inputIndex: index,
      });

      inputContainerRef.current.updateInputValue(callShowInputText(data));
      doInputFocus();
    }, RENDER_DELAY);
  }
  // 从候选词中直接选择
  function onSelect(payload) {
    if (checkIsExceed('onSelect')) {
      return;
    }
    dispatch({
      ignoreBlur: true,
    });
    inputContainerRef.current.updateInputValue(''); // 清空input输入值
    insertDataProcess([payload]);
  }

  function getLinedWord(data) {
    // 目前支持中英文的分号和逗号分割
    const arr = data.match(/[^;,；，\n\s]+/g);
    if (!arr) {
      return [];
    }

    const targets = [];
    arr.forEach(item => {
      // 支持用<x@y.com> 、（x@y.com）、(x@y.com)组合或者空格来分割出名称和地址
      const matched = item.match(/([^<（(]+)[<（(]([^>）)]+)[>）)]/) || item.match(/([^\s]+)[\s]+([\s\S]+)/) || [];
      if (matched.length === 3) {
        targets.push({
          label: RegExp.$1,
          value: RegExp.$2.replace(/\s/g, ''),
        })
      }else if (/\S+/.test(item)) {
        targets.push({
          label: '',
          value: item.replace(/\s/g, ''),
        })
      }
    });
    return targets;
  }

  function onPaste(e) {
    let data = e.clipboardData.getData('text/plain') || '';
    const targets = getLinedWord(data);
    // 符合粘贴规则粘贴时，阻止默认粘贴行为
    if (targets.length > 0) {
      e.preventDefault();
      // 向后插入
      // 粘贴点肯定已经点击过了，也就是插过空元素(也就是鼠标光标)，我们直接在鼠标光标前面插入待粘贴的
      // 并且光标的index相应变更了
      const filledValue = list.filter(item => item.value);
      const headCount = limit - filledValue.length;
      if(headCount > 0) { // 避免出现负数后slice导致重复
        const allowedTargets = targets.slice(0, headCount);
        insertDataProcess(allowedTargets);
      }
    }
  }
  // 拖拽相关
  function getDropTarget(node) {
    if (node.nodeName === 'DIV' && node.classList.contains('drop-tag')){
      return node;
    } else if (node.nodeName === 'LI' && node.classList.contains('drop-tag-li')) {
      return node.querySelector('.drop-tag');
    }
  }

  function remove(index) {
    list.splice(index, 1);
    props.onChange(list.slice());
  }

  function removeOverIndicator() {
    const indicatorClass = 'drag_over';
    containerRef.current.querySelectorAll('.' + indicatorClass).forEach(item => item.classList.remove(indicatorClass));
  }
  function onDragEnter(e) {
    if (!allowDrop) {
      return;
    }
    const target = getDropTarget(e.target);
    if (!target) {
      mainContainerRef.current.classList.add('drag_over');
    } else {
      mainContainerRef.current.classList.remove('drag_over');
    }
  }

  function onDragOver(e) {
    // 实测 macos chrome 95.0.4628 需要
    e.preventDefault();
  }

  function getNewIndex(list, newData) {
    return list.findIndex(item => item.value === newData.value && item.label === newData.label && item._key === newData._key);
  }

  function getTargetNode(htmlCollection, index) {
    const list = Array.prototype.filter.call(htmlCollection, (item) => !item.classList.contains('draw-item'));
    return list[index];
  }

  function onDrop(e) {
    if (!allowDrop) {
      return;
    }
    const addressStr = e.dataTransfer.getData('IM+MailAddress');
    if (!addressStr) {
      return;
    }
    e.preventDefault();
    const addressInfo = JSON.parse(addressStr);
    const target = getDropTarget(e.target); // target为空则表示放置至外层容器
    const targetIndex = target ? target.tabIndex : list.length; // 外层容器则让其直接插至末尾
    const newList = JSON.parse(JSON.stringify(list));
    let newIndex;
    if (addressInfo.uniqueKey === uniqueKey) {
      if (targetIndex === addressInfo.index) { // 原位不动
        return;
      } else if(addressInfo.index > targetIndex ) { // 前移
        newList.splice(addressInfo.index, 1);
        newList.splice(targetIndex, 0, {
          ...addressInfo.data,
        });
        props.onChange(newList);
      } else { // 后移
        newList.splice(targetIndex, 0, {
          ...addressInfo.data,
        });
        newList.splice(addressInfo.index, 1);
        props.onChange(newList);
      }
    } else {
      newList.splice(targetIndex, 0, {
        ...addressInfo.data,
      });
      props.onChange(newList);
      // 通知来源external的sis对拖拽元素进行移除
      MailMessageCenter.publish('sism.remove', [{
        key: addressInfo.uniqueKey,
        index: addressInfo.index,
      }]);
      MailMessageCenter.publish('sism.removeOverIndicator', [{
        key: addressInfo.uniqueKey,
      }]);
    }
    removeOverIndicator();
    // 聚焦
    newIndex = getNewIndex(newList, addressInfo.data);
    if (newIndex > -1) {
      setTimeout(() => {
        const nextIndex = newIndex + 1 >= newList.length ? newList.length : newIndex + 1; // 即nextIndex最大值为newList.length
        const targetNode = getTargetNode(mainContainerRef.current.children, nextIndex); // list里面已经将待编辑的删掉了，故原锚定节点后面的节点变成锚点，新锚点的index仍为index
        mainContainerRef.current.insertBefore(inputContainerRef.current.node, targetNode);
        dispatch({
          inputIndex: nextIndex,
        });

        doInputFocus();
      })
    }
  }

  function validate() {
    return new Promise(resolve => {
      const filled = list.filter(item => item.value);
      // validateMethod应返回布尔型的结果
      const validateResults = filled.map(item => validateMethod(item));
      // 返回数量和校验结果
      const everyValidated = validateResults.every(item => item);
      resolve({
        total: filled.length,
        isValid: everyValidated,
      });
    });
  }
   // 计算每个元素的可输入最大宽度
  useLayoutEffect(() => {
    setTimeout(() => {
      if (mainContainerRef.current) {
        const width = mainContainerRef.current.offsetWidth;
        if (width) {
          dispatch({
            maxWidth: width - 10 + 'px',
          });
        }
      }
    }, 4000);
  }, [propsRef.current.list]);

  useImperativeHandle(ref, () => ({
    showAddress,
    validate,
  }));

  function removeInvoke(payload) {
    if (payload && payload.key === uniqueKey) {
      remove(payload.index);
    }
  }

  function removeOverIndicatorInvoke(payload) {
    if (payload && payload.key === uniqueKey) {
      removeOverIndicator();
    }
  }

  // useEffect(() => {
  //   containerRef.current.addEventListener('paste', onPaste);
  //   return () => {
  //     containerRef.current.removeEventListener('paste', onPaste);
  //   }
  // }, []);

  const hasError = useMemo(() => {
    const filled = propsRef.current.list.filter(item => item.value);
    // validateMethod应返回布尔型的结果
    const validateResults = filled.map(item => validateMethod(item));
    // 返回数量和校验结果
    return validateResults.some(item => !item);
  }, [propsRef.current.list]);

  const showError = useMemo(() => {
    return showErrorBox && hasError;
  }, [hasError, showErrorBox]);

  useEffect(() => {
    const removeInvokeUuid = MailMessageCenter.subscribe('sism.remove', removeInvoke);
    const removeOverIndicatorInvokeUuid = MailMessageCenter.subscribe('sism.removeOverIndicator', removeOverIndicatorInvoke);
    containerRef.current.addEventListener('paste', onPaste);
    // 检查是否需要自动选中, 同时需要list为空，避免自动选中后再次进行自动选择
    if (!isMounted.current && callAutoSelect() && propsRef.current.list.length === 0) {
      tryAutoSelect();
    }
    isMounted.current = true; // 避免重复进入自动填充逻辑
    return () => {
      MailMessageCenter.removeListener('sism.remove', removeInvokeUuid);
      MailMessageCenter.removeListener('sism.removeOverIndicator', removeOverIndicatorInvokeUuid);
      containerRef.current.removeEventListener('paste', onPaste);
    };
  }, [propsRef.current.list]);

  return (
    <div className={['addressee', showError ? 'error' : ''].join(' ')} ref={containerRef}>
      <div className='address-box clearfix' style={{paddingLeft: 0, minHeight: '34px', height: 'auto'}} onDragEnter={onDragEnter} onDrop={onDrop} onDragOver={onDragOver}>
        <ul className='address-box-items clearfix' style={{width: '100%'}} ref={mainContainerRef} onClick={onOutClick}>
          {
            propsRef.current.list.map((item, index) => (
                <SmartInputSelectItem key={item.value + '_' + item._key} data={item} index={index}
                                      onItemDelete={onItemDelete}
                  onInsertClick={onInsertClick} onSelectClick={onSelectClick} onDoubleClick={onDoubleClick}
                                      validateMethod={validateMethod} callShowText={callShowItemText}
                                      uniqueKey={uniqueKey} allowDrop={allowDrop} allowDrag={allowDrag}
                                      selectedIndexList={state.selectedIndexList}
                />
            ))
          }
          <SmartInputSelectInput ref={inputContainerRef} list={list}
                                 isShow={list.length < limit}
                                 inputIndex={state.inputIndex}
                                 ignoreBlur={state.ignoreBlur}
                                 maxWidth={maxWidth}
                                 onMoveFocus={onInputMoveFocus}
                                 onChange={onInputChange} onInputFocus={onInputFocus} onInputBlur={onInputBlur}
                                 onInputBackspace={onInputBackspace} onInputDelete={onInputDelete}
                                 onEnterInsert={onInputEnterInsert}/>

        </ul>
      </div>
      {
        showError && props.error
      }
      <AssociateBox ref={associateContainerRef} callShowText={callShowAssociateText} show={showAddressListFlag && state.addressList.length > 0} list={state.addressList} onSelect={onSelect}/>
    </div>
  );
};

export default React.memo(forwardRef(SmartInputSelect));
