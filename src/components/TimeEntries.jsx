import { Table, Spin, Alert, Typography, Button, Space, Tag } from 'antd';
import dayjs from 'dayjs';
const { Text } = Typography;

function formatDate(value) {
  if (!value) return '';
  return dayjs(value).format('HH:mm, MMM DD, YYYY');
}

export function TimeEntriesList({
  entries,
  loading,
  error,
  offset,
  hasNextPage,
  selectedEntryId,
  onSelectEntry,
  onPageChange,
  onCreateNew,
}) {
  if (error) {
    return <Alert type="error" message={error} showIcon style={{ marginTop: 16 }} />;
  }

  const dataSource = entries.map((e) => ({ ...e, key: e.id }));
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Task ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 80,
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      width: 240,
      ellipsis: true,
    },
    {
      title: 'Start',
      dataIndex: 'start',
      key: 'start',
      render: (value) => <Text type="secondary">{formatDate(value)}</Text>,
    },
    {
      title: 'End',
      dataIndex: 'end',
      key: 'end',
      render: (value) => <Text type="secondary">{formatDate(value)}</Text>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => <Text type="secondary">{formatDate(value)}</Text>,
    },
  ];

  return (
    <>
      <div style={{ position: 'relative' }}>
        {
          !entries?.length ? (
            <Text type="secondary" style={{ display: 'block', padding: 24 }}>
              No time entries found.
            </Text>
          ) : (
            <Table
              size="middle"
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              onRow={(record) => ({
                onClick: () => onSelectEntry?.(record),
                style: {
                  cursor: 'pointer',
                  backgroundColor: selectedEntryId === record.id ? 'rgba(24, 144, 255, 0.08)' : undefined,
                },
              })}
            />
          )
        }
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(3px)',
              backgroundColor: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        )}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" onClick={onCreateNew}>
          New time entry
        </Button>
        <Space>
          <Button
            disabled={offset === 0 || loading}
            onClick={() => onPageChange?.('prev')}
          >
            Previous
          </Button>
          <Button
            disabled={!hasNextPage || loading}
            onClick={() => onPageChange?.('next')}
          >
            Next
          </Button>
        </Space>
      </div>
    </>
  );
}
