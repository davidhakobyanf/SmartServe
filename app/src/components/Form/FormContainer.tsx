'use client';

import { useState } from 'react';
import { Form as AntdForm } from 'antd';
import {
  TbChefHat,
  TbRefresh,
  TbToolsKitchen2,
  TbBell,
  TbTable,
} from 'react-icons/tb';
import css from './FormContainer.module.css';
import Registration from './Registration/Registration';
import Login from './Login/Login';

const FEATURES = [
  { icon: TbRefresh, text: 'Real-time order updates' },
  { icon: TbToolsKitchen2, text: 'Digital menu management' },
  { icon: TbBell, text: 'Waiter call notifications' },
  { icon: TbTable, text: 'Multi-table management' },
];

export default function FormContainer() {
  const [form] = AntdForm.useForm();
  const [check, setCheck] = useState(false);

  const handleCreate = () => {
    form.validateFields().catch(() => undefined);
  };

  return (
    <div className={css.page}>
      <div className={css.card}>
        <aside className={css.hero}>
          <div className={css.brand}>
            <span className={css.logo}>
              <TbChefHat />
            </span>
            <span className={css.brandName}>SmartServe</span>
          </div>

          <div className={css.heroBody}>
            <h1 className={css.heroTitle}>
              Smart restaurant management made simple
            </h1>
            <p className={css.heroSub}>
              Manage your menu, orders and customers in real-time. Built for
              modern restaurants.
            </p>

            <ul className={css.features}>
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className={css.feature}>
                  <span className={css.featureIcon}>
                    <Icon />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <span className={css.blob1} />
          <span className={css.blob2} />
        </aside>

        <section className={css.formSide}>
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
        </section>
      </div>
    </div>
  );
}
