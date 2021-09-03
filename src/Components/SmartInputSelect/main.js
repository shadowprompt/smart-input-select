import React, { useEffect, useState } from 'react';

const SmartInputSelectMain = (props) => {
  const [fields, setFields] = useState([]);

  function getField(payload) {
    if (payload && payload.key) {
      const target = fields.find(item => item.key === payload.key);
      return target && target.value;
    }
  }

  function addField(payload) {
    if (payload) {
      const existedField = getField(payload);
      if (existedField) {
        throw new Error('More than sis component with the key ' + payload.key);
      } else {
        const newFields = fields.slice();
        newFields.push(payload);
        setFields(newFields);
      }
    }
  }

  function invoke(payload) {
    const targetField = getField(payload);
    if (targetField) {
      const method = targetField[payload.method];
      const params = payload.params || [];
      typeof method === 'function' && method(...params);
    }
  }

  // useEffect(() => {
  //   const addFieldUuid = MailMessageCenter.subscribe('sism.addField',addField);
  //   const invokeUuid = MailMessageCenter.subscribe('sism.invoke',invoke);
  //   return () => {
  //     MailMessageCenter.removeListener('sism.addField', addFieldUuid);
  //     MailMessageCenter.removeListener('sism.invoke', invokeUuid);
  //   };
  // }, []);

  return (
    <section>
      { props.children }
    </section>
  );
};

export default SmartInputSelectMain;
