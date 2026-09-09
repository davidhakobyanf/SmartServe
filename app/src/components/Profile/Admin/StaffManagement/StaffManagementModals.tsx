import { useTranslations } from 'next-intl';
import { Form, Input, Modal, Select, type FormInstance } from 'antd';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import RemoteSelect from '@/components/Common/RemoteSelect';
import type { StaffRole, StaffUser } from '@/types/staff';
import type {
  PermissionValues,
  RejectValues,
  RoleAction,
  RoleFormValues,
  RoleSelectionValues,
} from './staffManagement.types';
import css from './StaffManagement.module.css';

interface SelectOption { value: string; label: string; }

interface StaffManagementModalsProps {
  actionLoading: boolean;
  roleTarget: StaffUser | null;
  roleAction: RoleAction;
  roleSelectionForm: FormInstance<RoleSelectionValues>;
  rejectTarget: StaffUser | null;
  rejectForm: FormInstance<RejectValues>;
  permissionTarget: StaffUser | null;
  permissionForm: FormInstance<PermissionValues>;
  roleModalOpen: boolean;
  editingRole: StaffRole | null;
  roleForm: FormInstance<RoleFormValues>;
  permissionOptions: SelectOption[];
  onSubmitRoleSelection: (values: RoleSelectionValues) => Promise<void>;
  onSubmitReject: (values: RejectValues) => Promise<void>;
  onSubmitPermissions: (values: PermissionValues) => Promise<void>;
  onSubmitRole: (values: RoleFormValues) => Promise<void>;
  onCloseRoleSelection: () => void;
  onCloseReject: () => void;
  onClosePermissions: () => void;
  onCloseRoleForm: () => void;
}

export default function StaffManagementModals(props: StaffManagementModalsProps) {
  const t = useTranslations('staff');

  return (
    <>
      <Modal
        open={Boolean(props.roleTarget)}
        title={props.roleAction === 'approve' ? t('modals.approveTitle') : t('modals.changeRoleTitle')}
        okText={props.roleAction === 'approve' ? t('actions.approve') : t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={props.actionLoading}
        onOk={() => props.roleSelectionForm.submit()}
        onCancel={props.onCloseRoleSelection}
      >
        <Form form={props.roleSelectionForm} layout="vertical" onFinish={(values) => void props.onSubmitRoleSelection(values)}>
          <p className={css.modalHint}>{props.roleTarget?.name} {props.roleTarget?.surname}</p>
          <Form.Item name="roleId" label={t('modals.roleLabel')} rules={[{ required: true, message: t('validation.role') }]}>
            <RemoteSelect resource="roles" activeOnly enabled={Boolean(props.roleTarget)}
              initialOptions={props.roleTarget?.role ? [{ value: props.roleTarget.role.id, label: props.roleTarget.role.name }] : []}
              placeholder={t('modals.rolePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(props.rejectTarget)}
        title={t('modals.rejectTitle')}
        okText={t('actions.reject')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
        confirmLoading={props.actionLoading}
        onOk={() => props.rejectForm.submit()}
        onCancel={props.onCloseReject}
      >
        <Form form={props.rejectForm} layout="vertical" onFinish={(values) => void props.onSubmitReject(values)}>
          <Form.Item name="reason" label={t('modals.reasonLabel')} rules={[{ required: true, min: 3, message: t('validation.reason') }]}>
            <Input.TextArea rows={4} placeholder={t('modals.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        width={680}
        open={Boolean(props.permissionTarget)}
        title={t('modals.permissionsTitle')}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={props.actionLoading}
        onOk={() => props.permissionForm.submit()}
        onCancel={props.onClosePermissions}
      >
        <p className={css.modalHint}>{t('modals.permissionsHint')}</p>
        <Form form={props.permissionForm} layout="vertical" onFinish={(values) => void props.onSubmitPermissions(values)}>
          <Form.Item name="permissionAllow" label={t('modals.allowLabel')}>
            <Select mode="multiple" options={props.permissionOptions} placeholder={t('modals.permissionsPlaceholder')} />
          </Form.Item>
          <Form.Item name="permissionDeny" label={t('modals.denyLabel')}>
            <Select mode="multiple" options={props.permissionOptions} placeholder={t('modals.permissionsPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        width={680}
        open={props.roleModalOpen}
        title={props.editingRole ? t('modals.editRoleTitle') : t('modals.createRoleTitle')}
        okText={props.editingRole ? t('common.save') : t('common.create')}
        cancelText={t('common.cancel')}
        confirmLoading={props.actionLoading}
        onOk={() => props.roleForm.submit()}
        onCancel={props.onCloseRoleForm}
      >
        <Form form={props.roleForm} layout="vertical" onFinish={(values) => void props.onSubmitRole(values)}>
          <LocalizedTextFields name="nameTranslations" label={t('modals.nameLabel')} placeholder={t('modals.namePlaceholder')} maxLength={100} required />
          {!props.editingRole && (
            <Form.Item name="code" label={t('modals.codeLabel')} rules={[
              { required: true, message: t('validation.code') },
              { pattern: /^[a-z][a-z0-9_]*$/, message: t('validation.codePattern') },
            ]}>
              <Input placeholder={t('modals.codePlaceholder')} />
            </Form.Item>
          )}
          <Form.Item name="permissions" label={t('modals.rolePermissionsLabel')}>
            <Select mode="multiple" options={props.permissionOptions} placeholder={t('modals.permissionsPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
