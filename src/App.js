import React, { useState, useRef } from 'react'
import SmartInputSelectMain from './Components/SmartInputSelect/main';
import SmartInputSelect from './Components/SmartInputSelect';
import { useSis } from './utils/Hooks/sis';
import { uuid } from './utils/index';

const systemSenderArr = [{
  label: '张三',
  value: 'zhangsan@qq.com'
}, {
  label: '李四',
  value: 'lisi@qq.com'
}];

function App() {
  const [senderArr, setSenderArr] = useState([]);
  const email = {
    targetsArr: [{
      label: '王五',
      value: 'wangwu@qq.com'
    }],
    ccTargetsArr: [{
      value: 'lisi@qq.com'
    }],
    bccTargetsArr: [{
      value: 'xxx'
    }],
  };

  const [[targetsArr, ccTargetsArr, bccTargetsArr], updateSis] = useSis(3, [email.targetsArr, email.ccTargetsArr, email.bccTargetsArr]);

  const senderRef = useRef(null);

  // 校验邮箱格式
  function validateMethod(data) {
    return /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,12}$/.test(data.value);
  }

  function getSender(text) {
    const searchText = text.toLowerCase().trim();
    if (searchText) {
      return systemSenderArr.filter(item => {
        const label = item.label.toLowerCase();
        const value = item.value.toLowerCase();
        return (
          label.indexOf(searchText) >= 0 || value.indexOf(searchText) >= 0
        );
      });
    }
    return systemSenderArr;
  }

  function callAutoSelect() {
    return true;
  }

  function beforeEditHook(editingIndex, editingItem) {
    const value = editingItem && editingItem.value || '';
    senderRef.current.showAddress(value);
  }

  function afterEditHook(index, item, list) {
    console.log('afterEditHook -> ', index, item, list);
  }

  function landingInterceptor(data) {
    if (data.label && !/^我不是/.test(data.label)) {
      return {
        ...data,
        label: '我不是' + data.label,
      }
    }
    return data;
  }

  function fetchListMethod(inputText) {
    const name = inputText.slice(0, 5);
    return new Promise(resolve => {
      setTimeout(() => {
        const list = Array(5).fill(1).map((item, index) => {
          const id = uuid();
          return {
            label: `用户${name}`,
            value: `${id}@qq.com`,
            emailAddress: Date.now() + '_' + index
          }
        });
        resolve(list);
      }, 1500)
    });
  }

  return (
    <div className="mail_project_2020">
      <div className="main-right">
        <div className="email-wrapper">
          <div className="email-section forward-email">
            <div className="email-content">
              <div className="email-infor">
                <SmartInputSelectMain>
                  <table>
                    <tbody>
                    <tr>
                      <td>发件人</td>
                      <td>
                        <SmartInputSelect
                          ref={senderRef}
                          uniqueKey='sender'
                          limit={1}
                          autoSelectTriggerLength={2}
                          allowDrop={false}
                          allowDrag={false}
                          callAutoSelect={callAutoSelect}
                          beforeEditHook={beforeEditHook}
                          afterEditHook={afterEditHook}
                          landingInterceptor={landingInterceptor}
                          validateMethod={validateMethod}
                          fetchListMethod={getSender}
                          onChange={setSenderArr}
                          list={senderArr}/>
                      </td>
                    </tr>
                      <tr>
                        <td>收件人</td>
                        <td>
                          <SmartInputSelect
                            uniqueKey='sis0'
                            validateMethod={validateMethod}
                            fetchListMethod={fetchListMethod}
                            onChange={(payload) => updateSis(0, payload)}
                            list={targetsArr}/>
                        </td>
                      </tr>
                      <tr>
                        <td>抄送人</td>
                        <td>
                          <SmartInputSelect
                            uniqueKey='sis1'
                            validateMethod={validateMethod}
                            onChange={(payload) => updateSis(1, payload)}
                            list={ccTargetsArr}/>
                        </td>
                      </tr>
                      <tr>
                        <td>密送人</td>
                        <td>
                          <SmartInputSelect
                            uniqueKey='sis2'
                            validateMethod={validateMethod}
                            onChange={(payload) => updateSis(2, payload)}
                            list={bccTargetsArr}/>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </SmartInputSelectMain>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
