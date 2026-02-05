import { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, Space, Typography, Popconfirm, App as AntdApp } from 'antd';
import dayjs from 'dayjs';
import { api } from '../api/api';

export function TimeEntryModal({ open, entry, onClose, onSaved, onDeleted }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    if (open) {
      if (entry) {
        form.setFieldsValue({
          taskId: entry.taskId,
          comment: entry.comment,
          start: entry.start ? dayjs(entry.start) : null,
          end: entry.end ? dayjs(entry.end) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, entry, form]);

  const handleFinish = async (values) => {
    const { taskId, comment, start, end } = values;
    if (start && end && start.isAfter(end)) {
      message.error('Start time must be before end time');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        taskId: Number(taskId),
        comment,
        start: start ? start.toISOString() : null,
        end: end ? end.toISOString() : null,
      };
      const result = entry
        ? (await api.put(`/time-entries/${entry.id}`, payload)).data
        : (await api.post('/time-entries', payload)).data;
      message.success(
        entry
          ? `Time entry #${result.id} updated successfully`
          : `Time entry created with ID #${result.id}`,
      );
      onSaved?.(result);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Failed to save time entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setDeleting(true);
    try {
      await api.delete(`/time-entries/${entry.id}`);
      message.success(`Time entry #${entry.id} deleted`);
      onDeleted?.(entry.id);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Failed to delete time entry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={entry ? `Edit time entry #${entry.id}` : 'New time entry'}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Task ID"
          name="taskId"
          rules={[{ required: true, message: 'Task ID is required' }]}
        >
          <Input type="number" min={1} placeholder="Enter task ID" />
        </Form.Item>
        <Form.Item
          label="Comment"
          name="comment"
          rules={[{ required: true, message: 'Comment is required' }]}
        >
          <Input.TextArea rows={3} placeholder="What did you work on?" />
        </Form.Item>
        <Form.Item
          label="Start"
          name="start"
          rules={[{ required: true, message: 'Start time is required' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="End"
          name="end"
          rules={[{ required: true, message: 'End time is required' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {entry ? (
              <Popconfirm
                title="Delete this time entry?"
                description={
                  <Typography.Text type="secondary">
                    This action cannot be undone.
                  </Typography.Text>
                }
                okText="Delete"
                okButtonProps={{ danger: true, loading: deleting }}
                cancelText="Cancel"
                onConfirm={handleDelete}
              >
                <Button danger>
                  Delete
                </Button>
              </Popconfirm>
            ) : (
              <span />
            )}
            <Space>
              <Button onClick={onClose}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {entry ? 'Save changes' : 'Create entry'}
              </Button>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

