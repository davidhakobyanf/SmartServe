'use client';

import { useState } from 'react';
import { Form as AntdForm } from 'antd';
import css from './FormContainer.module.css';
import Registration from './Registration/Registration';
import Login from './Login/Login';

export default function FormContainer() {
  const [form] = AntdForm.useForm();
  const [check, setCheck] = useState(false);

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        console.log('Form values:', values);
      })
      .catch((error) => {
        console.error('Validation failed:', error);
      });
  };

  return (
    <div className={css.container}>
      <div className={css.block}>
        <div className={css.left} />
        {check ? (
          <Registration form={form} setCheck={setCheck} />
        ) : (
          <Login
            form={form}
            handleCreate={handleCreate}
            check={check}
            setCheck={setCheck}
          />
        )}
      </div>
    </div>
  );
}
